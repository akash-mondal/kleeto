/**
 * Drives the metered path end to end over HTTP: fund a session, open a machine, watch the
 * meter tick, verify the chain, close it.
 */
const BASE = process.env.GATEWAY ?? "http://127.0.0.1:8787";
const LANE = process.argv[2] ?? "machine-1";
const j = async (path, init) => {
  const r = await fetch(BASE + path, { headers: { "Content-Type": "application/json" }, ...init });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

const ss = await j("/v1/sessions", { method: "POST", body: "{}" });
const sid = ss.body.sessionId;
console.log(`session ${sid}`);

// what an unfunded top-up looks like: the 402 an agent would answer
const q = await j(`/v1/sessions/${sid}/topup`, { method: "POST", body: JSON.stringify({ tinybar: 50_000_000 }) });
console.log(`top-up unpaid -> HTTP ${q.status}, offers: ${q.body.accepts?.map(a => `${a.extra.symbol} ${a.maxAmountRequired}`).join(" | ")}`);

await j(`/v1/sessions/${sid}/dev-credit`, { method: "POST", body: JSON.stringify({ tinybar: 50_000_000 }) });
const funded = await j(`/v1/sessions/${sid}`);
console.log(`funded  ${funded.body.balanceTinybar} tinybar ($${funded.body.balanceUsd})`);

console.log(`opening ${LANE}…`);
const lease = await j("/v1/leases", { method: "POST", body: JSON.stringify({ lane: LANE, sessionId: sid, seconds: 600 }) });
if (lease.status !== 201) { console.log("failed:", lease.status, JSON.stringify(lease.body).slice(0, 300)); process.exit(1); }
const id = lease.body.id;
console.log(`lease   ${id} · live at ${lease.body.liveUrl}`);

// watch the meter for eight seconds, the way a UI would
console.log("\nmeter stream:");
const ctrl = new AbortController();
const res = await fetch(`${BASE}/v1/leases/${id}/meter`, { signal: ctrl.signal });
const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = "", seen = 0;
const t0 = Date.now();
while (Date.now() - t0 < 9000) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const parts = buf.split("\n\n"); buf = parts.pop();
  for (const p of parts) {
    const ev = /event: (\w+)/.exec(p)?.[1];
    const data = /data: (.+)/.exec(p)?.[1];
    if (!ev || !data) continue;
    const d = JSON.parse(data);
    if (ev === "tick") {
      seen++;
      console.log(`  tick ${String(d.seq).padStart(2)}  spent ${String(d.spentTinybar).padStart(8)} tb  balance ${String(d.balanceTinybar).padStart(9)} tb  ${d.secondsRemaining}s left  chain ${d.chainHead.slice(0, 12)}…`);
    } else {
      console.log(`  ${ev}: ${JSON.stringify(d).slice(0, 130)}`);
    }
  }
}
ctrl.abort();

const proof = await j(`/v1/leases/${id}/proof`);
console.log(`\nproof   ${proof.body.seconds} seconds · ${proof.body.totalTinybar} tinybar`);
console.log(`        genesis ${proof.body.genesis?.slice(0, 24)}…  head ${proof.body.chainHead?.slice(0, 24)}…`);
console.log(`        recomputes: ${proof.body.selfCheck?.ok ? "MATCHES" : "BROKEN at " + proof.body.selfCheck?.brokeAt}`);

const closed = await j(`/v1/leases/${id}/stop`, { method: "POST" });
console.log(`\nclosed  used ${closed.body.secondsUsed}s of ${closed.body.secondsPurchased}s`);
const final = await j(`/v1/sessions/${sid}`);
console.log(`session balance left ${final.body.balanceTinybar} tinybar, spent ${final.body.spentTinybar}`);
