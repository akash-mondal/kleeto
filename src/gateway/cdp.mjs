/**
 * Driving a rented browser.
 *
 * Both browser lanes hand back a devtools endpoint — Solari's everyday pool and the stealth
 * pool alike — and until now nothing was on the other end of it. The catalogue advertised
 * navigate, screenshot, readPage and the rest for `browser` leases, the control endpoint had no
 * cases for any of them, and an agent that escalated to the stealth browser to get past a
 * CAPTCHA found a machine it could pay for and could not use. This is that other end.
 *
 * A connection per call rather than a pool. The page lives upstream and outlives the socket, so
 * there is no state here worth keeping, and a socket held open across a lease is a socket to
 * notice when it dies. The cost is a handshake per action, which is nothing next to a page load.
 */
const OPEN_MS = 15_000;
const CALL_MS = 30_000;

/** The keys an agent actually asks for by name; anything else is sent as a character. */
const KEYS = {
  Enter:      { key: "Enter", code: "Enter", keyCode: 13, text: "\r" },
  Tab:        { key: "Tab", code: "Tab", keyCode: 9 },
  Escape:     { key: "Escape", code: "Escape", keyCode: 27 },
  Backspace:  { key: "Backspace", code: "Backspace", keyCode: 8 },
  Delete:     { key: "Delete", code: "Delete", keyCode: 46 },
  ArrowUp:    { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  ArrowDown:  { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  ArrowLeft:  { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  PageDown:   { key: "PageDown", code: "PageDown", keyCode: 34 },
  PageUp:     { key: "PageUp", code: "PageUp", keyCode: 33 },
};

class Session {
  #ws; #next = 1; #waiting = new Map();

  constructor(ws) {
    this.#ws = ws;
    this.sessionId = null;
    this.attachNote = null;
    ws.addEventListener("message", (e) => {
      let msg; try { msg = JSON.parse(String(e.data)); } catch { return; }
      const pending = this.#waiting.get(msg.id);
      if (!pending) return;                       // an event, not an answer to anything
      this.#waiting.delete(msg.id);
      if (msg.error) pending.reject(new Error(`${msg.error.message ?? "devtools refused"}`));
      else pending.resolve(msg.result ?? {});
    });
  }

  static async open(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("the browser's devtools endpoint did not answer")), OPEN_MS);
      ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
      ws.addEventListener("error", () => { clearTimeout(t); reject(new Error("could not reach the browser")); }, { once: true });
    });
    const s = new Session(ws);
    /*
     * Some endpoints are the browser and some are already a page.
     *
     * Ask for targets; if that is refused, this is a page and commands go straight down it. If
     * it is answered but there is no page yet, wait a moment and ask again, then make one: a
     * browser rented and driven within a second of starting has been seen with an empty target
     * list, and the failure that produces is a devtools "'Page.navigate' wasn't found", which
     * reads like a missing feature rather than a browser that is still opening.
     */
    try {
      let page = null;
      for (let tries = 0; tries < 6 && !page; tries++) {
        const { targetInfos = [] } = await s.send("Target.getTargets");
        page = targetInfos.find((t) => t.type === "page" && !t.url.startsWith("devtools://")) ?? null;
        if (!page) await new Promise((r) => setTimeout(r, 400));
      }
      if (!page) {
        const made = await s.send("Target.createTarget", { url: "about:blank" });
        page = { targetId: made.targetId };
      }
      const { sessionId } = await s.send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
      s.sessionId = sessionId ?? null;
    } catch (e) {
      /* A page-level endpoint has no Target domain, and that is fine — commands go straight
         down it. Anything else is worth carrying, so a later failure can say why. */
      s.attachNote = String(e.message ?? e).slice(0, 160);
    }
    return s;
  }

  send(method, params = {}) {
    const id = this.#next++;
    const body = { id, method, params, ...(this.sessionId ? { sessionId: this.sessionId } : {}) };
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.#waiting.delete(id);
        reject(new Error(`${method} did not answer in time`));
      }, CALL_MS);
      this.#waiting.set(id, {
        resolve: (v) => { clearTimeout(t); resolve(v); },
        reject: (e) => { clearTimeout(t); reject(e); },
      });
      try { this.#ws.send(JSON.stringify(body)); }
      catch (e) { clearTimeout(t); this.#waiting.delete(id); reject(e); }
    });
  }

  /** Run an expression in the page and hand back a plain value. */
  async evaluate(expression, { awaitPromise = true } = {}) {
    const r = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise, allowUnsafeEvalBlockedByCSP: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text ?? "the page threw");
    }
    return r.result?.value;
  }

  close() { try { this.#ws.close(); } catch { /* already gone */ } }
}

/** Wait for the page to settle, without pretending a slow page is a failure. */
async function settle(s, ms = 20_000) {
  const until = Date.now() + ms;
  for (;;) {
    const state = await s.evaluate("document.readyState").catch(() => null);
    if (state === "complete" || state === "interactive") return state;
    if (Date.now() > until) return state ?? "unknown";
    await new Promise((r) => setTimeout(r, 400));
  }
}

/**
 * The browser verbs, over whatever devtools endpoint the lane gave us.
 * `lease.upstream.cdp` never leaves this process — it is an unauthenticated handle on a browser.
 */
export async function browserControl(lease, { action, ...args }) {
  const url = lease.upstream?.cdp || lease.upstream?.ws;
  if (!url) {
    throw Object.assign(new Error("this browser lease has no devtools endpoint"), { status: 409 });
  }
  const s = await Session.open(url);
  try {
    /* Every verb below drives a page. Without a session we would be talking to the browser
       itself, which answers "'Page.navigate' wasn't found" and tells nobody anything. */
    if (!s.sessionId && s.attachNote) {
      const probe = await s.send("Runtime.evaluate", { expression: "1", returnByValue: true }).catch(() => null);
      if (!probe) {
        throw Object.assign(
          new Error(`could not attach to a page in this browser: ${s.attachNote}`), { status: 502 });
      }
    }
    switch (action) {
      case "navigate": {
        const to = String(args.url ?? "");
        if (!/^https?:\/\//i.test(to)) {
          throw Object.assign(new Error("navigate needs an http(s) url"), { status: 400 });
        }
        await s.send("Page.enable").catch(() => {});
        await s.send("Page.navigate", { url: to });
        const state = await settle(s, Number(args.timeoutMs ?? 20_000));
        const where = await s.evaluate("({ url: location.href, title: document.title })").catch(() => null);
        return { navigated: to, readyState: state, ...(where ?? {}) };
      }

      case "screenshot": {
        const r = await s.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const bytes = Buffer.from(String(r.data), "base64").length;
        return { image: r.data, mime: "image/png", bytes };
      }

      case "readPage": {
        /* Text rather than markup: an agent asked to read a leaderboard wants the leaderboard,
           and 400kb of Tailwind classes is how a context window gets spent on nothing. */
        const out = await s.evaluate(`(() => {
          const t = document.body ? document.body.innerText : "";
          return {
            url: location.href,
            title: document.title,
            text: t.replace(/\\n{3,}/g, "\\n\\n").slice(0, 40000),
            truncated: t.length > 40000,
            links: [...document.querySelectorAll("a[href]")].slice(0, 200)
              .map((a) => ({ text: (a.innerText || "").trim().slice(0, 120), href: a.href }))
              .filter((l) => l.text),
          };
        })()`);
        return out ?? { text: "" };
      }

      case "evaluate": {
        const value = await s.evaluate(String(args.expression ?? args.script ?? ""));
        return { value };
      }

      case "click": {
        const x = Number(args.x), y = Number(args.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          throw Object.assign(new Error("click needs x and y"), { status: 400 });
        }
        const base = { x, y, button: args.button ?? "left", clickCount: 1 };
        await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...base });
        await s.send("Input.dispatchMouseEvent", { type: "mousePressed", ...base });
        await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...base });
        return { clicked: { x, y } };
      }

      case "type": {
        await s.send("Input.insertText", { text: String(args.text ?? "") });
        return { typed: String(args.text ?? "").length };
      }

      case "press": {
        const name = String(args.key ?? args.keys ?? "Enter");
        const k = KEYS[name] ?? { key: name, code: name, text: name.length === 1 ? name : undefined };
        await s.send("Input.dispatchKeyEvent", { type: k.text ? "keyDown" : "rawKeyDown", ...k });
        await s.send("Input.dispatchKeyEvent", { type: "keyUp", ...k });
        return { pressed: name };
      }

      default:
        throw Object.assign(new Error(`browsers do not support "${action}"`), { status: 400 });
    }
  } finally {
    s.close();
  }
}
