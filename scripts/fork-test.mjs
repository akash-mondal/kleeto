import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });

const snaps = await a.sandboxes.listSnapshots({});
const snapId = (snaps.snapshots ?? []).map(s => s.snapshotId ?? s.id).pop();
const lane = { id: "machine-2", ...requireLane("machine-2") };

const t0 = Date.now();
const h = await a.sandboxes.create({
  template: "base", cpu: lane.vcpu, memMb: lane.memGiB * 1024,
  timeoutMs: 300_000, lifecycle: { onTimeout: "kill" }, fromSnapshot: snapId,
});
console.log(`forked ${snapId} in ${Date.now() - t0}ms`);
try {
  // NO connect(): plain runCommand rides the warm HTTP fast path, which a restored
  // machine serves fine even while its control channel is still settling.
  const r = await h.runCommand("sh", { args: ["-c", "head -1 /work/out/report.md; echo ---; ls /data 2>/dev/null || echo '(no volume on fork)'"] });
  console.log("state carried across the fork:");
  console.log(r.stdout.split("\n").map(l => "   " + l).join("\n"));
  console.log(`exit ${r.exitCode}, total ${Date.now() - t0}ms`);
} catch (e) { console.error("  ✗", e.message); }
finally { await h.kill(); console.log("killed"); }
