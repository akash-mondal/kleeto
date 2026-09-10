import { SolariAdapter } from "/Users/akshmnd/Dev Projects/hedera-x402sandbox/src/adapters/solari.mjs";
import { requireLane } from "/Users/akshmnd/Dev Projects/hedera-x402sandbox/src/lanes.mjs";
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-2", ...requireLane("desktop-2"), diskGb: 20 },
  { timeoutMs: 1_800_000, template: "workstation", metadata: { kleeto: "diag" } });
try {
  console.log("disk before:", (await lease.sh("df -h / | tail -1")).trim());
  await lease.runLong("apt-get update -qq 2>&1 | tail -2", { pollMs: 5000 });
  const r = await lease.runLong(
    "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Options::=--force-confold kicad freecad qgis qgis-plugin-grass 2>&1 | tail -25; echo EXIT=$?",
    { pollMs: 15000, timeoutMs: 1_800_000 });
  console.log(r.slice(-2000));
  console.log("disk after:", (await lease.sh("df -h / | tail -1")).trim());
} finally { await lease.terminate().catch(() => {}); }
