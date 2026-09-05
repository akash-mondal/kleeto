import { SolariAdapter, sha256 } from "../src/adapters/solari.mjs";
import { requireLane, catalogue } from "../src/lanes.mjs";
import { resolveNetwork, TESTNET } from "../src/networks.mjs";
import { createHash } from "node:crypto";

const net = resolveNetwork(TESTNET);
const cat = await catalogue(net);
const laneId = "machine-1";
const lane = { id: laneId, ...requireLane(laneId) };
const priced = cat.lanes[laneId];

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
console.log(`lane ${laneId}  ${priced.creditTinybar} tinybar/s  ($${priced.usdPerHour}/hr)`);

const t0 = Date.now();
const m = await a.provision(lane, { idempotencyKey: crypto.randomUUID(), timeoutMs: 300_000,
  metadata: { kleeto: "lane-e2e" } });
console.log(`provisioned in ${Date.now() - t0}ms  handle ${m.handle.slice(0, 24)}…`);

let seconds = 0;
try {
// do real work
await a.sh(m.handle, "mkdir -p /work/out");
await a.writeFile(m.handle, "/work/out/notes.md", "# Kleeto lane test\nreal file, real hash\n");
await a.sh(m.handle, "cd /work/out && python3 -c \"open('data.csv','w').write('a,b\\n1,2\\n3,4\\n')\"");
const ver = await a.sh(m.handle, "python3 --version");

// the receipt primitive
const arts = await a.artifacts(m.handle, "/work/out");
console.log(`\npython: ${ver.trim()}`);
console.table(arts.map(x => ({ path: x.path, bytes: x.bytes, sha256: x.sha256.slice(0, 16) + "…" })));

// prove the in-machine hash matches what a buyer would compute after downloading
const pulled = await a.readFile(m.handle, "/work/out/notes.md");
const local = sha256(pulled);
const claimed = arts.find(x => x.path.endsWith("notes.md")).sha256;
console.log(`hash check: in-machine ${claimed.slice(0,16)}…  locally-recomputed ${local.slice(0,16)}…  ${local === claimed ? "MATCH" : "MISMATCH"}`);

// merkle root over the artifact list — constant size for the HCS message
const leaves = arts.map(x => createHash("sha256").update(`${x.sha256}:${x.bytes}:${x.path}`).digest());
let level = leaves;
while (level.length > 1) {
  const next = [];
  for (let i = 0; i < level.length; i += 2)
    next.push(createHash("sha256").update(Buffer.concat([level[i], level[i + 1] ?? level[i]])).digest());
  level = next;
}
console.log(`artifact root: ${level[0].toString("hex")}  (${arts.length} files, ${level[0].length} bytes on HCS regardless)`);

} finally {
  ({ seconds } = await a.terminate(m.handle, m.startedAt));
}
const owed = seconds * priced.creditTinybar;
console.log(`\nheld ${seconds}s -> ${owed.toLocaleString()} tinybar = $${(owed / 1e8 * cat.usdPerHbar).toFixed(6)}`);
