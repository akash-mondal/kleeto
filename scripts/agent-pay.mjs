/**
 * An agent with its own money, paying Kleeto's 402s.
 *
 * This is the client side of the product: no Kleeto account, no API key, no card. The agent
 * holds a Hedera account, answers the 402 with a signed transfer, and gets a machine.
 */
import { PrivateKey } from "@hiero-ledger/sdk";
import { createClientHederaSigner, ExactHederaScheme } from "@x402/hedera";
import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { readFileSync } from "node:fs";

const BASE = process.env.GATEWAY ?? "http://127.0.0.1:8787";
const cfg = JSON.parse(readFileSync("var/hedera.json", "utf8"));
const signer = createClientHederaSigner(cfg.agentId, PrivateKey.fromStringDer(cfg.agentKey));

/**
 * register(network, client): the scheme is registered per network, not globally.
 *
 * Spend controls are off because they price a payment in USD to enforce a cap, and they only
 * know how to price the network's default asset. With them on, the HBAR half of a two-asset
 * offer is silently filtered out and the agent always pays in USDC no matter what it asked
 * for. An agent that wants a cap should set one it can apply to both assets.
 */
const client = new x402Client(
  // the constructor takes the selector: pick the asset this agent was told to pay in
  (_v, accepts) => accepts.find((a) => (a.extra?.symbol ?? "").toLowerCase() === asset) ?? accepts[0],
).register("hedera:testnet", new ExactHederaScheme(signer));
client.setSpendControls(false);
const pay = wrapFetchWithPayment(fetch, client);

const asset = (process.argv[2] ?? "usdc").toLowerCase();
console.log(`agent ${cfg.agentId} paying in ${asset.toUpperCase()}\n`);

/**
 * Which asset the agent pays in is the agent's call, and a two-asset 402 is what makes that
 * call possible. The gateway orders the offer to match `?prefer=`, and the client takes the
 * first one it can satisfy, so the choice is exercised end to end rather than asserted.
 */
const prefer = `?prefer=${asset}`;

// 1. open a session and fund it
const ss = await (await fetch(`${BASE}/v1/sessions`, { method: "POST" })).json();
console.log(`session ${ss.sessionId}`);

const topup = await pay(`${BASE}/v1/sessions/${ss.sessionId}/topup${prefer}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ tinybar: 60_000_000 }),   // 0.6 HBAR of credit
});
const t = await topup.json();
console.log(`top-up  HTTP ${topup.status} · paid in ${t.asset} · ${t.creditedTinybar} tinybar credited`);
if (t.settlement) console.log(`        settled ${t.settlement.transaction}\n        ${t.settlement.explorer}`);
if (!topup.ok) process.exit(1);

// 2. open a machine against the balance; no further payment, the meter spends it
const lease = await (await fetch(`${BASE}/v1/leases`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lane: process.argv[3] ?? "machine-1", sessionId: ss.sessionId, seconds: 600 }),
})).json();
console.log(`lease   ${lease.id ?? JSON.stringify(lease).slice(0, 200)}`);
if (!lease.id) process.exit(1);
console.log(`live    ${lease.liveUrl}`);

// 3. watch the meter spend it
await new Promise((r) => setTimeout(r, 6000));
const m = await (await fetch(`${BASE}/v1/leases/${lease.id}`)).json();
const sess = await (await fetch(`${BASE}/v1/sessions/${ss.sessionId}`)).json();
console.log(`\nafter 6s: ${m.secondsUsed}s used · balance ${sess.balanceTinybar} tinybar ($${sess.balanceUsd}) · ${sess.secondsRemaining}s left`);

const proof = await (await fetch(`${BASE}/v1/leases/${lease.id}/proof`)).json();
console.log(`proof   ${proof.seconds} ticks · chain ${proof.selfCheck?.ok ? "MATCHES" : "BROKEN"}`);

await fetch(`${BASE}/v1/leases/${lease.id}/stop`, { method: "POST" });
console.log("closed.");
