/**
 * The Kleeto gateway.
 *
 * One HTTP surface: quote a machine, take payment over x402 on Hedera in either USDC or HBAR,
 * hand back a lease and a live view. Everything upstream of this file is an implementation
 * detail the caller never sees.
 */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

import { resolveNetwork, resolveFeePayer, hashscanTx } from "../networks.mjs";
import { catalogue, requireLane } from "../lanes.mjs";
import { Store, newId } from "./store.mjs";
import { provision, terminate, publicView, leaksVendor } from "./vendors.mjs";
import { buildChallenge, decodePaymentHeader, matchRequirements, Facilitator, X402_VERSION } from "./x402.mjs";
import { viewerPage, attachLiveSocket } from "./live.mjs";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.PORT ?? 8787);
const NETWORK = process.env.HEDERA_NETWORK === "mainnet" ? "hedera:mainnet" : "hedera:testnet";
const PAY_TO = process.env.HEDERA_OPERATOR_ID;
const ORIGIN = process.env.PUBLIC_ORIGIN ?? `http://localhost:${PORT}`;
const MAX_SECONDS = Number(process.env.MAX_LEASE_SECONDS ?? 3600);

const net = resolveNetwork(NETWORK);
const store = new Store({ path: process.env.LEASE_STORE ?? "var/leases.json" });
const facilitator = new Facilitator(net);

/**
 * Resolved once at boot from the facilitator's own `/supported`. If it is not advertising
 * this network the gateway must not start: serving a 402 with a guessed fee payer would take
 * money for a payment that can never settle.
 */
let feePayer = null;

const app = new Hono();
app.use("*", cors({ origin: "*", allowHeaders: ["X-PAYMENT", "Content-Type"], exposeHeaders: ["X-PAYMENT-RESPONSE"] }));

app.get("/healthz", (c) => c.json({
  ok: true, network: net.caip2, feePayer, origin: ORIGIN,
  openLeases: store.open().length, at: new Date().toISOString(),
}));

/** The menu. Prices are quoted live against the ledger's own rate, in both assets. */
app.get("/v1/lanes", async (c) => {
  const cat = await catalogue(net);
  const lanes = Object.values(cat.lanes).map((l) => ({
    lane: l.id, kind: l.family, vcpu: l.vcpu, memGiB: l.memGiB, resolution: l.resolution,
    creditTinybar: l.creditTinybar, usdPerHour: l.usdPerHour,
    ...(l.mbCeiling ? { mbCeiling: l.mbCeiling } : {}),
    stealth: Boolean(l.stealth), captcha: Boolean(l.captcha),
  }));
  return c.json({ network: cat.network, usdPerHbar: cat.usdPerHbar, assets: ["USDC", "HBAR"], lanes });
});

/**
 * Rent a machine.
 *
 * Without payment this answers 402 and a two-asset quote. With an `X-PAYMENT` header it
 * verifies, settles, and only then spends money upstream: provisioning before settlement
 * would hand out free machines to anyone who can craft a plausible header.
 */
app.post("/v1/leases", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const laneId = String(body.lane ?? "");
  const seconds = Math.min(Math.max(Number(body.seconds ?? 600), 30), MAX_SECONDS);

  let lane;
  try { lane = requireLane(laneId); }
  catch { return c.json({ error: "unknown lane", hint: "GET /v1/lanes" }, 400); }

  const cat = await catalogue(net);
  const priced = cat.lanes[laneId];
  const tinybar = Math.ceil(priced.creditTinybar * seconds);
  const resource = `${ORIGIN}/v1/leases`;
  const description = `${laneId} for ${seconds}s`;
  const challenge = buildChallenge({
    net, payTo: PAY_TO, feePayer, resource, description, tinybar, usdPerHbar: cat.usdPerHbar,
  });

  const payment = decodePaymentHeader(c.req.header("X-PAYMENT"));
  if (!payment) return c.json(challenge, 402);

  const requirements = matchRequirements(challenge, payment);
  if (!requirements) {
    return c.json({ ...challenge, error: "payment does not match any offered asset" }, 402);
  }

  const v = await facilitator.verify(payment, requirements);
  if (!v.ok || v.body?.isValid === false) {
    return c.json({ ...challenge, error: "payment rejected", reason: v.body?.invalidReason ?? v.body }, 402);
  }

  const s = await facilitator.settle(payment, requirements);
  if (!s.ok || s.body?.success === false) {
    return c.json({ ...challenge, error: "settlement failed", reason: s.body?.errorReason ?? s.body }, 402);
  }
  const txId = s.body?.transaction ?? s.body?.txHash ?? s.body?.transactionId ?? null;

  // paid: now it is safe to spend upstream
  let up;
  try {
    up = await provision(laneId, { seconds, metadata: { kleeto: "lease" } });
  } catch (e) {
    // The agent paid and got nothing. Say so plainly and record it; a silent 500 here is the
    // one failure that would deserve a refund, so it must be visible in the ledger.
    const dead = store.put({
      id: newId("ls"), lane: laneId, kind: lane.family, state: "failed", network: net.caip2,
      asset: requirements.asset, creditTinybar: priced.creditTinybar, secondsPurchased: seconds,
      paidTinybar: tinybar, settlementTx: txId, error: String(e.message).slice(0, 200),
      createdAt: new Date().toISOString(),
    });
    return c.json({ error: "paid but the machine did not come up", leaseId: dead.id,
                    settlementTx: txId, contact: "this lease is owed a refund" }, 502);
  }

  const now = Date.now();
  const lease = store.put({
    id: newId("ls"),
    lane: laneId, kind: up.kind, state: "open", network: net.caip2,
    asset: requirements.asset, assetSymbol: requirements.extra?.symbol,
    creditTinybar: priced.creditTinybar, secondsPurchased: seconds, paidTinybar: tinybar,
    settlementTx: txId,
    ...(lane.mbCeiling ? { mbCeiling: lane.mbCeiling, mbUsed: 0 } : {}),
    viewToken: randomBytes(18).toString("base64url"),
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + seconds * 1000).toISOString(),
    createdAt: new Date(now).toISOString(),
    // never serialised toward a client; publicView() is an allowlist
    vendor: up.vendor, vendorId: up.vendorId, upstream: up.upstream,
  });
  live.set(lease.id, up.handle);

  const out = publicView(lease, { origin: ORIGIN });
  const leak = leaksVendor(out);
  if (leak.length) {
    // Fail closed. A leak here is the one bug that breaks the product's promise.
    console.error("white-label leak in lease response:", leak);
    return c.json({ error: "internal" }, 500);
  }
  c.header("X-PAYMENT-RESPONSE", Buffer.from(JSON.stringify({ success: true, transaction: txId, network: net.caip2 })).toString("base64"));
  return c.json({ ...out, settlement: txId ? { transaction: txId, explorer: hashscanTx(net, txId) } : null }, 201);
});

/** Live handles, keyed by lease id. Lost on restart; the lease record survives. */
const live = new Map();

app.get("/v1/leases/:id", (c) => {
  const l = store.get(c.req.param("id"));
  if (!l) return c.json({ error: "no such lease" }, 404);
  const used = Math.max(0, Math.round((Date.now() - new Date(l.startedAt).getTime()) / 1000));
  return c.json(publicView({ ...l, secondsUsed: Math.min(used, l.secondsPurchased) }, { origin: ORIGIN }));
});

app.post("/v1/leases/:id/stop", async (c) => {
  const l = store.get(c.req.param("id"));
  if (!l) return c.json({ error: "no such lease" }, 404);
  if (l.state === "closed") return c.json(publicView(l, { origin: ORIGIN }));

  const fin = await terminate(l);
  const used = Math.max(1, Math.round((Date.now() - new Date(l.startedAt).getTime()) / 1000));
  const secondsUsed = Math.min(used, l.secondsPurchased);
  const closed = store.patch(l.id, {
    state: "closed", secondsUsed, closedAt: new Date().toISOString(),
    refundTinybar: Math.max(0, (l.secondsPurchased - secondsUsed) * l.creditTinybar),
    ...(fin.mb ? { mbUsed: fin.mb } : {}),
  });
  live.delete(l.id);
  return c.json(publicView(closed, { origin: ORIGIN }));
});

/** The viewer. Ours, on our origin, with the supplier resolved server-side. */
app.get("/live/:token", (c) => {
  const token = c.req.param("token");
  const l = store.byViewToken(token);
  if (!l) return c.text("This live view has expired.", 404);
  const wsProto = ORIGIN.startsWith("https") ? "wss" : "ws";
  const wsPath = `${wsProto}://${new URL(ORIGIN).host}/live/${token}/socket`;
  return c.html(viewerPage({ lease: l, wsPath, origin: ORIGIN }));
});

async function main() {
  if (!PAY_TO) {
    throw new Error("HEDERA_OPERATOR_ID is not set: the gateway has no account to be paid into");
  }
  feePayer = await resolveFeePayer(net);
  console.log(`kleeto gateway
  network    ${net.caip2}
  facilitator${" ".repeat(0)} ${net.facilitator}
  fee payer  ${feePayer}   (resolved from /supported)
  pay to     ${PAY_TO}
  assets     USDC ${net.usdc} · HBAR 0.0.0
  origin     ${ORIGIN}
  listening  :${PORT}`);

  const server = serve({ fetch: app.fetch, port: PORT });
  attachLiveSocket(server, {
    store,
    resolveUpstream: (lease) => lease.upstream ?? null,
  });
}

// pathToFileURL, not string concatenation: a space in the path percent-encodes in
// import.meta.url but not in argv, and the naive compare silently never runs main()
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("gateway failed to start:", e.message); process.exit(1); });
}

export { app, store, main };
