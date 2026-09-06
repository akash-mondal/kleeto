import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
const lane = { id: "desktop-2", ...requireLane("desktop-2") };
const m = await a.provision(lane, { timeoutMs: 240_000, metadata: { kleeto: "stream-probe" } });
console.log("desktop up:", m.handle.slice(0, 24) + "…");
console.log("streamUrl:", m.streamUrl ? m.streamUrl.slice(0, 62) + "…" : "(none)");

try {
  if (!m.streamUrl) throw new Error("no streamUrl returned");
  const first = await new Promise((res, rej) => {
    const ws = new WebSocket(m.streamUrl);
    ws.binaryType = "arraybuffer";
    const t = setTimeout(() => { ws.close(); rej(new Error("timeout waiting for first frame")); }, 20000);
    ws.onmessage = (ev) => {
      clearTimeout(t);
      const b = Buffer.from(ev.data instanceof ArrayBuffer ? ev.data : ev.data);
      ws.close(); res(b);
    };
    ws.onerror = (e) => { clearTimeout(t); rej(new Error("ws error: " + (e.message ?? "unknown"))); };
    ws.onclose = (e) => { clearTimeout(t); rej(new Error(`ws closed ${e.code} ${e.reason || ""}`)); };
  });
  const ascii = first.toString("latin1").replace(/[^\x20-\x7e]/g, ".");
  console.log(`first frame: ${first.length} bytes | ${JSON.stringify(ascii.slice(0, 24))}`);
  console.log(/^RFB \d{3}\.\d{3}/.test(first.toString("latin1"))
    ? "  -> RFB handshake confirmed: noVNC can render this directly"
    : "  -> not an RFB banner; inspect before wiring a viewer");
} catch (e) {
  console.log("stream check FAILED:", e.message);
} finally {
  const { seconds } = await a.terminate(m.handle, m.startedAt);
  console.log(`torn down after ${seconds}s`);
}
