/**
 * Driving a rented machine.
 *
 * The gateway could rent machines and meter them, but an agent that leases a desktop and
 * cannot click on it has bought a photograph. This is the control surface: shell, files,
 * screen, mouse, keyboard, applications.
 *
 * Two rules hold throughout. Nothing here accepts or returns a supplier's identifier, so the
 * lease id is the only handle a client ever holds; and every call requires an open lease,
 * because control is what the meter is charging for and a paused lease has stopped paying.
 */
import { SolariAdapter } from "../adapters/solari.mjs";

/**
 * Handles live in memory and a restart loses them, so a lease that outlived the process is
 * re-attached on first use rather than declared dead. The upstream machine is still running
 * and still being paid for; refusing to reconnect would strand it.
 */
export async function handleFor(lease, live) {
  const cached = live.get(lease.id);
  if (cached) return cached;
  if (lease.vendor !== "solari" || !lease.vendorId) return null;
  const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
  const reattached = await a.attach(lease.vendorId, { desktop: lease.kind === "desktop" });
  await reattached.channel().catch(() => {});
  live.set(lease.id, reattached);
  return reattached;
}

/** The actions a lease exposes, by kind. Advertised so an agent can discover them. */
export const ACTIONS = {
  machine: ["exec", "read", "write", "list", "artifacts", "preview"],
  desktop: ["exec", "read", "write", "list", "artifacts", "preview",
            "screenshot", "click", "doubleClick", "move", "drag", "scroll",
            "type", "press", "hotkey", "open", "display"],
  browser: ["navigate", "screenshot", "click", "type", "press", "evaluate", "readPage"],
};

/**
 * One entry point rather than a route per verb, because the set is long and an agent that has
 * to learn twenty endpoints will use five. `action` names the verb; everything else is its
 * arguments.
 */
export async function control(lease, handle, { action, ...args }) {
  if (!handle) throw Object.assign(new Error("this lease has no control channel"), { status: 409 });
  const allowed = ACTIONS[lease.kind] ?? [];
  if (!allowed.includes(action)) {
    throw Object.assign(
      new Error(`${lease.kind} leases do not support "${action}"; try ${allowed.join(", ")}`),
      { status: 400 });
  }

  switch (action) {
    /* ---- shell and files, on machines and desktops alike ---- */
    case "exec": {
      const out = await handle.runLong(String(args.command ?? ""), {
        pollMs: 3000, timeoutMs: Math.min(Number(args.timeoutMs ?? 120_000), 1_800_000),
      });
      return { stdout: String(out).slice(0, 200_000) };
    }
    case "read":     return { contents: await handle.readFile(String(args.path)) };
    case "write":    { await handle.writeFile(String(args.path), String(args.contents ?? "")); return { written: args.path }; }
    case "list":     return { entries: await handle.h.fs.list(String(args.path ?? "/work")) };
    case "artifacts":return { artifacts: await handle.artifacts(String(args.path ?? "/work/out")) };
    case "preview":  return await handle.previewUrl(Number(args.port ?? 8080));

    /* ---- the screen ---- */
    case "screenshot": {
      const png = Buffer.from(await handle.screenshot({ format: "png" }));
      return { image: png.toString("base64"), mime: "image/png", bytes: png.length };
    }
    case "display":  return await handle.h.display.size();

    /* ---- pointer and keys ---- */
    case "move":        { await handle.h.mouse.move(+args.x, +args.y); return { at: { x: +args.x, y: +args.y } }; }
    case "click":       { await handle.h.mouse.click(+args.x, +args.y, args.button ? { button: args.button } : undefined); return { clicked: { x: +args.x, y: +args.y } }; }
    case "doubleClick": { await handle.h.mouse.doubleClick(+args.x, +args.y); return { doubleClicked: { x: +args.x, y: +args.y } }; }
    case "drag":        { await handle.h.mouse.drag({ x: +args.fromX, y: +args.fromY }, { x: +args.toX, y: +args.toY }); return { dragged: true }; }
    case "scroll":      { await handle.h.mouse.scroll(+args.x, +args.y, { dy: Number(args.dy ?? 0), dx: Number(args.dx ?? 0) }); return { scrolled: true }; }
    case "type":        { await handle.h.keyboard.type(String(args.text ?? "")); return { typed: String(args.text ?? "").length }; }
    case "press":       { await handle.h.keyboard.press(args.keys ?? args.key); return { pressed: args.keys ?? args.key }; }
    case "hotkey":      { await handle.h.keyboard.hotkey(...(args.keys ?? [])); return { pressed: args.keys }; }
    case "open":        { await handle.openApp(String(args.app), args.args ?? []); return { opened: args.app }; }

    default:
      throw Object.assign(new Error(`unknown action ${action}`), { status: 400 });
  }
}
