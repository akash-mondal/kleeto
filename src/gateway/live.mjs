/**
 * The live view, served by Kleeto.
 *
 * The point of this file is that a person watching their agent work never learns who supplies
 * the machine. Two things follow from that and both are enforced here rather than by
 * convention:
 *
 *   - the viewer page is ours, served from our origin, with our chrome on it;
 *   - the pixels arrive over a WebSocket to our host, which relays to the supplier. The
 *     supplier's URL is resolved server-side from an opaque token and never reaches a browser.
 *
 * The token is the capability. It is unguessable, it is scoped to one lease, and it dies with
 * the lease, so a link can be shared without handing over the lease itself.
 */
import { WebSocketServer, WebSocket } from "ws";

/** Kleeto's own viewer. No vendor script, no vendor origin, no vendor name. */
export function viewerPage({ lease, wsPath, origin }) {
  const title = `${lease.lane} · live`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>${title} · Kleeto</title>
<style>
  :root { --ground:#141110; --fg:#f4eee4; --muted:#a89f92; --amber:#f5b301; --line:#2a2422; }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--ground); color:var(--fg); font:14px/1.5 ui-sans-serif,system-ui,sans-serif;
         min-height:100vh; display:flex; flex-direction:column; }
  header { display:flex; align-items:center; gap:14px; padding:12px 18px; border-bottom:1px solid var(--line); }
  .mark { width:20px; height:20px; flex:none; }
  .name { font-weight:600; letter-spacing:.16em; font-size:13px; }
  .spacer { flex:1; }
  .pill { font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.06em; color:var(--muted);
          border:1px solid var(--line); border-radius:999px; padding:5px 11px; }
  .dot { width:7px; height:7px; border-radius:50%; background:var(--amber); display:inline-block;
         margin-right:7px; vertical-align:middle; }
  main { flex:1; display:grid; place-items:center; padding:18px; }
  #stage { position:relative; width:100%; max-width:1280px; aspect-ratio:16/9; background:#0d0b09;
           border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  #screen { width:100%; height:100%; object-fit:contain; display:block; }
  #status { position:absolute; inset:0; display:grid; place-items:center; color:var(--muted);
            font-family:ui-monospace,monospace; font-size:12px; text-align:center; padding:20px; }
  footer { padding:10px 18px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; }
</style></head>
<body>
<header>
  <svg class="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16.95 1.80 L15.05 1.80 L15.38 4.50 L16.62 4.50 Z M23.92 4.18 L22.28 3.23 L21.21 5.73 L22.29 6.35 Z M28.77 9.72 L27.82 8.08 L25.65 9.71 L26.27 10.79 Z M30.20 16.95 L30.20 15.05 L27.50 15.38 L27.50 16.62 Z" fill="#f5b301"/>
    <path d="M16.00 9.85 L21.80 13.20 L16.00 16.55 L10.20 13.20 Z" fill="#f5b301"/>
    <path d="M10.20 13.20 L16.00 16.55 L16.00 22.15 L10.20 18.80 Z" fill="#efe9df" fill-opacity=".5"/>
    <path d="M21.80 13.20 L16.00 16.55 L16.00 22.15 L21.80 18.80 Z" fill="#efe9df" fill-opacity=".85"/>
  </svg>
  <span class="name">KLEETO</span>
  <span class="pill">${lease.lane}</span>
  <span class="spacer"></span>
  <span class="pill"><span class="dot"></span><span id="state">connecting</span></span>
  <span class="pill" id="meter">0s</span>
</header>
<main><div id="stage">
  <img id="screen" alt="Live view of the machine" hidden/>
  <div id="status">opening the live view…</div>
</div></main>
<footer>Read-only. This is your agent working on a machine it rented by the second.</footer>
<script>
  const wsUrl = ${JSON.stringify(wsPath)};
  const img = document.getElementById("screen");
  const status = document.getElementById("status");
  const state = document.getElementById("state");
  const meter = document.getElementById("meter");
  const started = ${JSON.stringify(lease.startedAt)};
  setInterval(() => {
    const s = Math.max(0, Math.round((Date.now() - new Date(started).getTime()) / 1000));
    meter.textContent = s < 60 ? s + "s" : Math.floor(s / 60) + "m " + (s % 60) + "s";
  }, 1000);

  let ws, backoff = 500;
  function connect() {
    ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => { state.textContent = "live"; backoff = 500; };
    ws.onmessage = (ev) => {
      // frames arrive as base64 jpeg; anything else is a control message
      if (typeof ev.data !== "string") return;
      if (ev.data.startsWith("{")) {
        try { const m = JSON.parse(ev.data); if (m.state) state.textContent = m.state;
              if (m.note) status.textContent = m.note; } catch {}
        return;
      }
      img.src = "data:image/jpeg;base64," + ev.data;
      if (img.hidden) { img.hidden = false; status.textContent = ""; }
    };
    ws.onclose = () => {
      state.textContent = "reconnecting";
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 10000);
    };
    ws.onerror = () => ws.close();
  }
  connect();
</script>
</body></html>`;
}

/**
 * Relay frames from the supplier to the viewer.
 *
 * For a browser lane this drives CDP's screencast, which is the only way to get pixels out of
 * a headless Chrome without linking the supplier's own viewer. For a desktop it relays the RFB
 * socket. Either way the browser only ever holds a socket to us.
 */
export function attachLiveSocket(httpServer, { store, resolveUpstream }) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, "http://internal");
    const m = url.pathname.match(/^\/live\/([A-Za-z0-9_-]+)\/socket$/);
    if (!m) return socket.destroy();
    const lease = store.byViewToken(m[1]);
    if (!lease || (lease.state !== "open" && lease.state !== "paused")) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (client) => relay(client, lease));
  });

  async function relay(client, lease) {
    const upstream = resolveUpstream(lease);
    const say = (o) => { try { client.send(JSON.stringify(o)); } catch {} };
    if (!upstream) { say({ state: "unavailable", note: "this machine has no live view" }); return; }

    if (upstream.cdp) return relayCdp(client, upstream.cdp, say);
    if (upstream.stream) return relayRaw(client, upstream.stream, say);
    say({ state: "unavailable", note: "this machine has no live view" });
  }

  /**
   * CDP screencast: ask Chrome for jpeg frames and forward them, acking each one.
   *
   * Suppliers hand back either an HTTP devtools endpoint or a browser-level WebSocket. The
   * WebSocket case needs a target attached before any Page command will land, so both shapes
   * are normalised to "a socket with a session on a page" before the screencast starts.
   */
  async function relayCdp(client, cdpUrl, say) {
    let wsUrl = cdpUrl;
    if (/^https?:/i.test(cdpUrl)) {
      try {
        const list = await fetch(cdpUrl.replace(/\/$/, "") + "/json/list").then((r) => r.json());
        wsUrl = (list.find((t) => t.type === "page") ?? list[0])?.webSocketDebuggerUrl;
      } catch {
        return say({ state: "unavailable", note: "could not reach the machine" });
      }
      if (!wsUrl) return say({ state: "unavailable", note: "no page to show" });
    }

    const up = new WebSocket(wsUrl, { perMessageDeflate: false });
    let id = 0;
    let session = null;
    const send = (method, params, sessionId) =>
      up.send(JSON.stringify({ id: ++id, method, params, ...(sessionId ? { sessionId } : {}) }));

    const startScreencast = (sessionId) => {
      send("Page.enable", {}, sessionId);
      send("Page.startScreencast",
        { format: "jpeg", quality: 70, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 },
        sessionId);
      say({ state: "live" });
    };

    up.on("open", () => {
      // A page-level endpoint takes Page commands directly; a browser-level one does not,
      // and answers Target.getTargets instead. Try the cheap path and fall back on the reply.
      send("Target.getTargets", {});
    });

    up.on("message", (buf) => {
      let msg;
      try { msg = JSON.parse(buf.toString()); } catch { return; }

      if (msg.result?.targetInfos) {
        const page = msg.result.targetInfos.find((t) => t.type === "page" && !t.url.startsWith("devtools://"));
        if (!page) { say({ state: "unavailable", note: "no page open on this machine" }); return; }
        send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
        return;
      }
      if (msg.result?.sessionId && !session) {
        session = msg.result.sessionId;
        startScreencast(session);
        return;
      }
      // a page-level endpoint rejects Target.getTargets; screencast it without a session
      if (msg.error && !session) { session = undefined; startScreencast(undefined); return; }

      if (msg.method === "Page.screencastFrame") {
        try { client.send(msg.params.data); } catch {}
        send("Page.screencastAck", { sessionId: msg.params.sessionId }, msg.sessionId);
      }
    });

    up.on("close", () => client.close());
    up.on("error", (e) => { say({ state: "unavailable", note: "lost the machine" }); client.close(); });
    client.on("close", () => { try { up.close(); } catch {} });
  }

  /** A plain byte relay, for suppliers that already speak a stream we can pass through. */
  function relayRaw(client, url, say) {
    const up = new WebSocket(url);
    up.on("open", () => say({ state: "live" }));
    up.on("message", (b) => { try { client.send(b); } catch {} });
    up.on("close", () => client.close());
    up.on("error", () => { say({ state: "unavailable" }); client.close(); });
    client.on("message", (b) => { try { up.send(b); } catch {} });
    client.on("close", () => { try { up.close(); } catch {} });
  }

  return wss;
}
