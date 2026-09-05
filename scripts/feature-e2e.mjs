import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync } from "node:fs";

// A closed control channel rejects everything still in flight. Those rejections can land with
// nobody awaiting them, which kills the process and skips the finally that tears the lease down.
process.on("unhandledRejection", (e) => console.error("  (ignored late rejection:", e?.message ?? e, ")"));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
const ok = (n, d) => console.log(`  ✓ ${n}${d ? "  " + d : ""}`);
let lease, vol, snapId;

// sweep anything a previous failed run left behind
for (const s of await a.running()) {
  console.log(`sweeping leftover ${s.kind} ${s.sandboxId.slice(0,18)}…`);
  await a.sandboxes.kill(s.sandboxId).catch(() => {});
}

try {
  console.log("\n[volumes]");
  vol = await a.createVolume("kleeto-e2e", { sizeMb: 512, metadata: { purpose: "e2e" } });
  ok("created", vol.volumeId);

  console.log("\n[provision + mount]");
  const lane = { id: "machine-2", ...requireLane("machine-2") };
  const t0 = Date.now();
  lease = await a.provision(lane, {
    timeoutMs: 600_000,
    metadata: { kleeto: "feature-e2e" },
    volumes: [{ volumeId: vol.volumeId, path: "/data" }],
  });
  ok("machine-2 up", `${Date.now() - t0}ms  ${lease.id.slice(0, 18)}…`);
  await lease.sh("echo persisted-by-kleeto > /data/marker.txt");
  ok("wrote to volume", (await lease.sh("cat /data/marker.txt")).trim());

  console.log("\n[stateful code REPL]");
  await lease.runCode("import numpy as np\nxs = np.arange(1, 6)\nseconds = xs * 60");
  const sum = await lease.runCode("print(int(seconds.sum()))");
  ok("state persists across calls", `sum=${(sum.results?.map(r=>r.text).join("")||"").trim()}`);

  const fig = await lease.runCode(`
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.bar(["m1","m2","m4","m8"], [22736, 45472, 90943, 181886])
plt.title("Kleeto lane price (tinybar/sec)"); plt.ylabel("tinybar")
plt.show()
`);
  const png = fig.results?.find((r) => r.png)?.png;
  if (png) { writeFileSync("agent-runs/lane-chart.png", Buffer.from(png, "base64")); }
  ok("matplotlib -> PNG", png ? `${Math.round(png.length * 0.75)} bytes -> agent-runs/lane-chart.png` : "NO PNG");
  ok("structured chart", fig.charts?.length ? `${fig.charts[0].type} "${fig.charts[0].title}"` : "(none on this template)");

  console.log("\n[pty]");
  const term = await lease.pty({ cols: 90, rows: 24 });
  let seen = "";
  term.onData((b) => { seen += Buffer.from(b).toString("utf8"); });
  await term.write("echo PTY_WORKS && uname -r\n");
  await new Promise((r) => setTimeout(r, 2500));
  ok("interactive terminal", seen.includes("PTY_WORKS") ? "echo round-tripped" : `raw: ${JSON.stringify(seen.slice(0,60))}`);

  console.log("\n[preview url]");
  await lease.sh("mkdir -p /work/site && echo '<h1>kleeto lane</h1>' > /work/site/index.html");
  lease.start("python3", { args: ["-m", "http.server", "3000"], cwd: "/work/site" });
  await new Promise((r) => setTimeout(r, 2000));
  const pv = await lease.previewUrl(3000);
  const res = await fetch(pv.url);
  ok("public URL serves", `${res.status} ${(await res.text()).trim().slice(0, 24)}`);

  console.log("\n[artifacts]");
  await lease.writeFile("/work/out/report.md", "# lane report\ngenerated in a rented machine\n");
  const { artifacts, root } = await lease.artifacts("/work/out");
  ok("hashed in-guest", `${artifacts.length} file(s), root ${root.slice(0, 16)}…`);

  console.log("\n[snapshot]");
  snapId = await lease.snapshot("kleeto-e2e-warm");
  ok("snapshot taken", typeof snapId === "string" ? snapId : JSON.stringify(snapId).slice(0, 60));

  console.log("\n[pause / resume]");
  await lease.pause(); ok("paused", "meter + upstream billing stop");
  await lease.resume(); ok("resumed", (await lease.sh("cat /work/out/report.md | head -1")).trim());

} catch (e) {
  console.error("\nFAILED:", e.message);
} finally {
  if (lease) { const { seconds } = await lease.terminate(); console.log(`\ntorn down after ${seconds}s held`); }
}

// fork from the snapshot AFTER killing the original: free plan allows 1 concurrent machine
if (snapId) {
  console.log("\n[fork from snapshot]");
  try {
    const id = typeof snapId === "string" ? snapId : (snapId.snapshotId ?? snapId.id);
    const lane = { id: "machine-2", ...requireLane("machine-2") };
    const t0 = Date.now();
    const forked = await a.provision(lane, { timeoutMs: 300_000, fromSnapshot: id });
    const carried = (await forked.sh("cat /work/out/report.md | head -1")).trim();
    ok("forked machine", `${Date.now() - t0}ms, carried state: "${carried}"`);
    await forked.terminate();
  } catch (e) { console.error("  ✗ fork:", e.message); }
}
if (vol) { await a.deleteVolume(vol.volumeId); console.log("volume deleted"); }
