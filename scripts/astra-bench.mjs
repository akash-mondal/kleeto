/**
 * Stands up one desktop lease, records it, and holds it open while an external agent drives
 * it through the provider's MCP tools. Writes the lease id where the runner can read it.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
process.on("unhandledRejection", () => {});
const OUT = "agent-runs/astra"; mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_600_000, metadata: { kleeto: "astra-bench" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const id = lease.id ?? d.sandboxId ?? d.id;
log("lease up:", id);
writeFileSync(`${OUT}/lease-id.txt`, String(id));

await lease.channel();
await d.health();
await lease.sh("mkdir -p /work/out && rm -f /work/out/report.pdf && ls -la /work/out").catch(() => {});
try { await d.record.start({ fps: 8 }); log("recording"); } catch (e) { log("record failed:", e.message); }

// hold the lease open; the runner kills this process when the agent is done
log("holding. lease id in", `${OUT}/lease-id.txt`);
const stop = async () => {
  try {
    const rec = await d.record.stop();
    const url = await d.record.downloadUrl(rec?.id ?? rec);
    writeFileSync(`${OUT}/recording-url.txt`, String(url));
    log("recording saved");
  } catch (e) { log("record stop failed:", e.message); }
  await lease.terminate().catch(() => {});
  log("terminated");
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
