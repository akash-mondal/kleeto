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

import { resolveNetwork, resolveFeePayer, hashscanTx, hashscanAccount, mirror } from "../networks.mjs";
import { catalogue, requireLane } from "../lanes.mjs";
import { imageCatalogue } from "../images.mjs";
import { Store, newId } from "./store.mjs";
import { provision, terminate, publicView, leaksVendor } from "./vendors.mjs";
import { buildChallenge, decodePaymentHeader, matchRequirements, Facilitator, X402_VERSION } from "./x402.mjs";
import { viewerPage, attachLiveSocket } from "./live.mjs";
import { Meter, verifyChain, genesis } from "./meter.mjs";
import { control, handleFor, ACTIONS } from "./control.mjs";
import { JobQueue } from "./jobs.mjs";
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
 * One meter for the whole gateway. It ticks every open lease once a second, debits the
 * session that paid for it, and hash-chains each second to the one before, so the bill is
 * something a buyer recomputes rather than something we assert.
 */
const meter = new Meter({
  store,
  lowWaterSeconds: Number(process.env.LOW_WATER_SECONDS ?? 60),
  anchorEverySec: Number(process.env.ANCHOR_EVERY_SEC ?? 60),
  onAnchor: (a) => hcs?.anchor(a).catch(() => {}),
});
let hcs = null;   // set at boot when a topic is configured

/**
 * Two at a time, because that is what the upstream plan and this VM actually carry. Everyone
 * else waits in a line they can see.
 */
const jobs = new JobQueue({
  path: process.env.JOB_STORE ?? "var/jobs.json",
  concurrency: Number(process.env.JOB_CONCURRENCY ?? 2),
});

/** Everything the meter says, fanned out to whoever is watching a lease. */
const watchers = new Map();   // leaseId -> Set<(event, data) => void>
function watch(leaseId, fn) {
  if (!watchers.has(leaseId)) watchers.set(leaseId, new Set());
  watchers.get(leaseId).add(fn);
  return () => watchers.get(leaseId)?.delete(fn);
}
function fanout(event, data) {
  for (const fn of watchers.get(data.leaseId) ?? []) { try { fn(event, data); } catch {} }
}
for (const e of ["open", "tick", "low", "exhausted", "anchor", "paid", "closed"]) {
  meter.on(e, (d) => fanout(e, d));
}

/**
 * Resolved once at boot from the facilitator's own `/supported`. If it is not advertising
 * this network the gateway must not start: serving a 402 with a guessed fee payer would take
 * money for a payment that can never settle.
 */
let feePayer = null;

/**
 * A 402, the way a v2 client reads one.
 *
 * The challenge travels in the `PAYMENT-REQUIRED` header as base64 JSON; the body is only
 * consulted for x402 v1. Sending the body alone is the difference between a client that pays
 * and one that reports "invalid payment required response", so both go out: the header for
 * machines, the body for anyone reading with curl.
 */
/**
 * Put the caller's preferred asset first. Both are always offered: a preference reorders the
 * list, it never removes an option, so an agent that cannot satisfy its first choice can still
 * pay with the other.
 */
function orderByPreference(challenge, prefer) {
  if (!prefer) return challenge;
  const want = String(prefer).toLowerCase();
  const accepts = [...challenge.accepts].sort((a, b) =>
    ((b.extra?.symbol ?? "").toLowerCase() === want ? 1 : 0) -
    ((a.extra?.symbol ?? "").toLowerCase() === want ? 1 : 0));
  return { ...challenge, accepts };
}

function challenge402(c, challenge, extra = {}) {
  c.header("PAYMENT-REQUIRED", Buffer.from(JSON.stringify(challenge)).toString("base64"));
  c.header("Cache-Control", "no-store");
  return c.json({ ...challenge, ...extra }, 402);
}

const app = new Hono();
app.use("*", cors({ origin: "*", allowHeaders: ["PAYMENT-SIGNATURE", "X-PAYMENT", "Content-Type"], exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE", "X-PAYMENT-RESPONSE"] }));

app.get("/healthz", (c) => c.json({
  ok: true, network: net.caip2, feePayer, origin: ORIGIN,
  openLeases: store.open().length, at: new Date().toISOString(),
}));

/** The menu. Prices are quoted live against the ledger's own rate, in both assets. */
/**
 * What software a desktop can boot with. Separate from the lane list because the two are
 * separate choices: the lane is how much machine and sets the price, the image is what is
 * installed on it and costs nothing extra.
 */
app.get("/v1/images", (c) => c.json({ images: imageCatalogue() }));

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

/* ------------------------------------------------------------------ sessions ---- */
/**
 * A session is a funded balance an agent draws down by the second. It is free to open; the
 * money arrives at the top-up, and the metering happens against the balance.
 *
 * This is what makes the product metered rather than prepaid. `exact` can only pay once for
 * one thing, so the payment buys credit and the credit is spent a second at a time.
 */
app.post("/v1/sessions", (c) => {
  const id = newId("ss");
  meter.session(id);
  return c.json({
    sessionId: id, balanceTinybar: 0, network: net.caip2,
    topUpUrl: `${ORIGIN}/v1/sessions/${id}/topup`,
    assets: ["USDC", "HBAR"],
  }, 201);
});

app.get("/v1/sessions/:id", async (c) => {
  const s = meter.sessions.get(c.req.param("id"));
  if (!s) return c.json({ error: "no such session" }, 404);
  const cat = await catalogue(net);
  const leases = store.all().filter((l) => l.sessionId === s.id);
  const burn = leases.filter((l) => l.state === "open").reduce((n, l) => n + l.creditTinybar, 0);
  return c.json({
    sessionId: s.id,
    balanceTinybar: s.balanceTinybar,
    balanceUsd: +((s.balanceTinybar / 1e8) * cat.usdPerHbar).toFixed(6),
    spentTinybar: s.spentTinybar,
    spentUsd: +((s.spentTinybar / 1e8) * cat.usdPerHbar).toFixed(6),
    burnTinybarPerSec: burn,
    secondsRemaining: burn ? Math.floor(s.balanceTinybar / burn) : null,
    topUps: s.topUps,
    leases: leases.map((l) => ({ id: l.id, lane: l.lane, state: l.state })),
  });
});

/**
 * Add credit. This is the x402 gate: unpaid it answers 402 with both assets, paid it settles
 * through Blocky402 and the balance goes up by exactly what was settled.
 */
app.post("/v1/sessions/:id/topup", async (c) => {
  const s = meter.sessions.get(c.req.param("id"));
  if (!s) return c.json({ error: "no such session" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const tinybar = Math.max(1, Math.ceil(Number(body.tinybar ?? 100_000_000)));   // default 1 HBAR

  const cat = await catalogue(net);
  const challenge = orderByPreference(buildChallenge({
    net, payTo: PAY_TO, feePayer,
    resource: `${ORIGIN}/v1/sessions/${s.id}/topup`,
    description: `top up session ${s.id}`,
    tinybar, usdPerHbar: cat.usdPerHbar,
  }), c.req.query("prefer"));

  const payment = decodePaymentHeader((h) => c.req.header(h));
  if (!payment) return challenge402(c, challenge);

  const requirements = matchRequirements(challenge, payment);
  if (!requirements) return challenge402(c, challenge, { error: "payment does not match any offered asset" });

  const v = await facilitator.verify(payment, requirements);
  if (!v.ok || v.body?.isValid === false) {
    return challenge402(c, challenge, { error: "payment rejected", reason: v.body?.invalidReason ?? v.body });
  }
  const settled = await facilitator.settle(payment, requirements);
  if (!settled.ok || settled.body?.success === false) {
    return challenge402(c, challenge, { error: "settlement failed", reason: settled.body?.errorReason ?? settled.body });
  }
  const txId = settled.body?.transaction ?? settled.body?.transactionId ?? null;
  const balance = s.credit(tinybar, { transaction: txId, asset: requirements.extra?.symbol });

  // tell every open lease on this session that money landed, so a watching UI can show it
  for (const l of store.all().filter((x) => x.sessionId === s.id && x.state !== "closed")) {
    fanout("paid", { leaseId: l.id, sessionId: s.id, tinybar, asset: requirements.extra?.symbol,
                     transaction: txId, balanceTinybar: balance,
                     explorer: txId ? hashscanTx(net, txId) : null });
    if (l.state === "paused" && l.pausedReason === "balance exhausted") {
      store.patch(l.id, { state: "open", pausedReason: null });
    }
  }
  const settleHeader = Buffer.from(JSON.stringify({ success: true, transaction: txId, network: net.caip2 })).toString("base64");
  c.header("PAYMENT-RESPONSE", settleHeader);
  c.header("X-PAYMENT-RESPONSE", settleHeader);
  return c.json({
    sessionId: s.id, creditedTinybar: tinybar, balanceTinybar: balance,
    asset: requirements.extra?.symbol,
    settlement: txId ? { transaction: txId, explorer: hashscanTx(net, txId) } : null,
  }, 200);
});

/**
 * Credit a session without settling, for testing the meter before an account exists.
 *
 * Off unless KLEETO_DEV_CREDIT is set, and it announces itself in the response so a stray
 * enablement in production is visible in the first reply rather than in the accounts later.
 */
app.post("/v1/sessions/:id/dev-credit", async (c) => {
  if (!process.env.KLEETO_DEV_CREDIT) return c.json({ error: "not found" }, 404);
  const s = meter.sessions.get(c.req.param("id"));
  if (!s) return c.json({ error: "no such session" }, 404);
  const { tinybar = 100_000_000 } = await c.req.json().catch(() => ({}));
  const balance = s.credit(Math.ceil(tinybar), { transaction: "dev-credit", asset: "DEV" });
  for (const l of store.all().filter((x) => x.sessionId === s.id && x.state === "paused")) {
    store.patch(l.id, { state: "open", pausedReason: null });
    fanout("paid", { leaseId: l.id, sessionId: s.id, tinybar, asset: "DEV", balanceTinybar: balance });
  }
  return c.json({ sessionId: s.id, balanceTinybar: balance, settled: false, warning: "dev credit, no payment settled" });
});

/* --------------------------------------------------------------------- jobs ---- */
/**
 * Ask the agent to do something.
 *
 * Free to submit: the money moves when the agent rents a machine, out of its own wallet, not
 * here. What this buys is a place in the line.
 */
app.post("/v1/jobs", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 10) return c.json({ error: "say what the agent should do, in a sentence or more" }, 400);
  const job = jobs.submit({
    prompt, image: body.image ?? null, lane: body.lane ?? null,
    by: (c.req.header("x-forwarded-for") ?? "").split(",")[0] || null,
  });
  return c.json({ ...job, board: jobs.board().capacity }, 202);
});

app.get("/v1/jobs", (c) => c.json(jobs.board()));
app.get("/v1/jobs/:id", (c) => {
  const v = jobs.view(c.req.param("id"));
  return v ? c.json(v) : c.json({ error: "no such job" }, 404);
});

/**
 * The worker side. A worker claims one job at a time and reports as it goes; the queue hands
 * out nothing when the machines are full, which is what keeps a third caller from becoming a
 * third machine.
 */
const workerAuth = (c) =>
  !process.env.WORKER_TOKEN || c.req.header("x-worker-token") === process.env.WORKER_TOKEN;

app.post("/v1/jobs/claim", async (c) => {
  if (!workerAuth(c)) return c.json({ error: "not authorised" }, 401);
  const { worker } = await c.req.json().catch(() => ({}));
  const job = jobs.claim(worker);
  if (!job) return c.json({ job: null, ...jobs.board() }, 200);
  return c.json({ job: { id: job.id, prompt: job.prompt, image: job.image, lane: job.lane } });
});

app.post("/v1/jobs/:id/report", async (c) => {
  if (!workerAuth(c)) return c.json({ error: "not authorised" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const v = jobs.update(c.req.param("id"), body);
  return v ? c.json(v) : c.json({ error: "no such job" }, 404);
});

/* --------------------------------------------------------------------- demo ---- */
/**
 * What the try-it page needs: the demo agent's real balance, straight off the ledger.
 *
 * Read-only and unauthenticated on purpose. It exposes an account id and two balances, all of
 * which are already public on a mirror node, and never the key that spends them.
 */
let balanceCache = { at: 0, body: null };
app.get("/v1/demo", async (c) => {
  const agentId = process.env.DEMO_AGENT_ID;
  if (!agentId) return c.json({ error: "no demo agent configured" }, 503);

  // The mirror node is the source of truth and is rate limited; a few seconds of cache keeps
  // a page that polls from hammering it without ever showing a stale-looking number.
  if (Date.now() - balanceCache.at < 5000 && balanceCache.body) return c.json(balanceCache.body);

  try {
    const [acct, cat] = await Promise.all([
      mirror(net, `/api/v1/accounts/${agentId}?limit=1`),
      catalogue(net),
    ]);
    const tinybar = Number(acct?.balance?.balance ?? 0);
    const usdcRaw = (acct?.balance?.tokens ?? []).find((t) => t.token_id === net.usdc);
    const body = {
      agent: agentId,
      network: net.caip2,
      hbar: { tinybar, display: (tinybar / 1e8).toFixed(4), usd: +((tinybar / 1e8) * cat.usdPerHbar).toFixed(2) },
      usdc: { units: Number(usdcRaw?.balance ?? 0), display: (Number(usdcRaw?.balance ?? 0) / 1e6).toFixed(6) },
      usdPerHbar: cat.usdPerHbar,
      explorer: hashscanAccount(net, agentId),
      queue: jobs.board(),
      lanes: Object.values(cat.lanes).map((l) => ({ lane: l.id, kind: l.family, usdPerHour: l.usdPerHour })),
    };
    balanceCache = { at: Date.now(), body };
    return c.json(body);
  } catch (e) {
    return c.json({ error: "could not read the ledger", detail: String(e.message).slice(0, 160) }, 502);
  }
});

/* -------------------------------------------------------------------- meter ---- */
/**
 * The meter, live.
 *
 * Server-sent events rather than polling, because the thing being shown is a number changing
 * every second and a UI that polls will always be a second behind the truth it is drawing.
 * Every event carries the chain head, so a viewer is watching the same evidence the receipt
 * is built from rather than a pretty approximation of it.
 */
app.get("/v1/leases/:id/meter", (c) => {
  const lease = store.get(c.req.param("id"));
  if (!lease) return c.json({ error: "no such lease" }, 404);

  return c.newResponse(
    new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const send = (event, data) =>
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

        send("hello", {
          leaseId: lease.id, lane: lease.lane, rateTinybar: lease.creditTinybar,
          state: lease.state, ...(meter.state(lease.id) ?? {}),
        });
        const off = watch(lease.id, send);
        const keep = setInterval(() => controller.enqueue(enc.encode(": keepalive\n\n")), 15000);
        c.req.raw.signal.addEventListener("abort", () => {
          off(); clearInterval(keep);
          try { controller.close(); } catch {}
        });
      },
    }),
    { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" } },
  );
});

/** The working behind the bill: every second, hash-chained, recomputable without us. */
app.get("/v1/leases/:id/proof", (c) => {
  const lease = store.get(c.req.param("id"));
  if (!lease) return c.json({ error: "no such lease" }, 404);
  const proof = meter.proof(lease.id) ?? lease.proof;
  if (!proof) return c.json({ error: "no ticks recorded for this lease" }, 404);
  const g = genesis(lease);
  const check = verifyChain({ genesisHash: g, leaseId: lease.id, ticks: proof.ticks ?? [] });
  return c.json({
    leaseId: lease.id, lane: lease.lane, rateTinybar: lease.creditTinybar,
    genesis: g, chainHead: proof.chainHead, seconds: proof.seconds,
    totalTinybar: proof.totalTinybar, selfCheck: check,
    hcsTopic: process.env.HCS_TOPIC_ID ?? null,
    howToVerify: "sha256(prev|seq|leaseId|tinybar|at) for each tick, starting from genesis",
    ticks: proof.ticks ?? [],
  });
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

  /**
   * Two ways to pay for a machine, and the difference matters.
   *
   * With a funded session the meter is the payment: the balance was settled earlier and gets
   * spent a second at a time, which is the metered path and the one the product is built on.
   * Without one, a single `exact` payment buys a fixed block up front, which is simpler for a
   * one-shot job but is prepayment rather than metering.
   */
  const sessionId = body.sessionId ? String(body.sessionId) : null;
  let txId = null;
  let requirements = null;

  if (sessionId) {
    const sess = meter.sessions.get(sessionId);
    if (!sess) return c.json({ error: "no such session" }, 404);
    if (sess.balanceTinybar < priced.creditTinybar * 30) {
      // Refuse to open a machine that cannot run for half a minute; the agent should top up
      // first rather than watch it pause immediately.
      return challenge402(c, buildChallenge({ net, payTo: PAY_TO, feePayer,
        resource: `${ORIGIN}/v1/sessions/${sessionId}/topup`,
        description: `top up session ${sessionId}`,
        tinybar: Math.max(priced.creditTinybar * 300, 100_000_000), usdPerHbar: cat.usdPerHbar }), {
        error: "session balance too low to open this lane",
        balanceTinybar: sess.balanceTinybar,
        needTinybarPerSec: priced.creditTinybar,
      });
    }
  } else {
    const payment = decodePaymentHeader((h) => c.req.header(h));
    if (!payment) return challenge402(c, challenge);

    requirements = matchRequirements(challenge, payment);
    if (!requirements) {
      return challenge402(c, challenge, { error: "payment does not match any offered asset" });
    }

    const v = await facilitator.verify(payment, requirements);
    if (!v.ok || v.body?.isValid === false) {
      return challenge402(c, challenge, { error: "payment rejected", reason: v.body?.invalidReason ?? v.body });
    }

    const settled = await facilitator.settle(payment, requirements);
    if (!settled.ok || settled.body?.success === false) {
      return challenge402(c, challenge, { error: "settlement failed", reason: settled.body?.errorReason ?? settled.body });
    }
    txId = settled.body?.transaction ?? settled.body?.txHash ?? settled.body?.transactionId ?? null;
  }

  // paid: now it is safe to spend upstream
  let up;
  try {
    up = await provision(laneId, { seconds, image: body.image, metadata: { kleeto: "lease" } });
  } catch (e) {
    // The agent paid and got nothing. Say so plainly and record it; a silent 500 here is the
    // one failure that would deserve a refund, so it must be visible in the ledger.
    const dead = store.put({
      id: newId("ls"), lane: laneId, kind: lane.family, state: "failed", network: net.caip2,
      asset: requirements?.asset ?? null, creditTinybar: priced.creditTinybar, secondsPurchased: seconds,
      paidTinybar: tinybar, settlementTx: txId, error: String(e.message).slice(0, 200),
      createdAt: new Date().toISOString(),
    });
    return c.json({ error: "paid but the machine did not come up", leaseId: dead.id,
                    settlementTx: txId, contact: "this lease is owed a refund" }, 502);
  }

  const now = Date.now();
  const lease = store.put({
    id: newId("ls"),
    lane: laneId, kind: up.kind, image: up.image ?? "base", state: "open", network: net.caip2,
    sessionId,
    asset: requirements?.asset ?? null, assetSymbol: requirements?.extra?.symbol ?? null,
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
  // A session-funded lease is metered from here; a prepaid one is credited its block first so
  // the same tick loop, and the same hash chain, covers both.
  if (!sessionId) meter.session(lease.id).credit(tinybar, { transaction: txId, asset: requirements?.extra?.symbol });
  meter.start({ ...lease, sessionId: sessionId ?? lease.id });

  const out = publicView(lease, { origin: ORIGIN });
  const leak = leaksVendor(out);
  if (leak.length) {
    // Fail closed. A leak here is the one bug that breaks the product's promise.
    console.error("white-label leak in lease response:", leak);
    return c.json({ error: "internal" }, 500);
  }
  const settleHeader = Buffer.from(JSON.stringify({ success: true, transaction: txId, network: net.caip2 })).toString("base64");
  c.header("PAYMENT-RESPONSE", settleHeader);
  c.header("X-PAYMENT-RESPONSE", settleHeader);
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
  const proof = meter.proof(l.id);
  meter.stop(l.id);
  const closed = store.patch(l.id, {
    state: "closed", secondsUsed, closedAt: new Date().toISOString(),
    proof: proof ? { seconds: proof.seconds, totalTinybar: proof.totalTinybar,
                     chainHead: proof.chainHead, ticks: proof.ticks } : undefined,
    refundTinybar: Math.max(0, (l.secondsPurchased - secondsUsed) * l.creditTinybar),
    ...(fin.mb ? { mbUsed: fin.mb } : {}),
  });
  live.delete(l.id);
  return c.json(publicView(closed, { origin: ORIGIN }));
});

/**
 * Drive the machine.
 *
 * One endpoint for every verb, because an agent asked to learn twenty routes will use five.
 * Only an open lease may be driven: a paused one has stopped paying, and control is the thing
 * being paid for.
 */
app.post("/v1/leases/:id/control", async (c) => {
  const lease = store.get(c.req.param("id"));
  if (!lease) return c.json({ error: "no such lease" }, 404);
  if (lease.state !== "open") {
    return c.json({ error: `lease is ${lease.state}`,
                    hint: lease.state === "paused" ? "top up the session to resume" : undefined }, 409);
  }
  const body = await c.req.json().catch(() => ({}));
  try {
    const handle = await handleFor(lease, live);
    const result = await control(lease, handle, body);
    return c.json({ leaseId: lease.id, action: body.action, ...result });
  } catch (e) {
    return c.json({ error: String(e.message).slice(0, 300) }, e.status ?? 500);
  }
});

/** What this lease can be asked to do. */
app.get("/v1/leases/:id/actions", (c) => {
  const lease = store.get(c.req.param("id"));
  if (!lease) return c.json({ error: "no such lease" }, 404);
  return c.json({ leaseId: lease.id, kind: lease.kind, actions: ACTIONS[lease.kind] ?? [] });
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
    resolveUpstream: (lease) => lease.upstream ? { ...lease.upstream, kind: lease.kind, leaseId: lease.id } : null,
    /** One frame, as jpeg, for a desktop being watched. */
    grabFrame: async (leaseId) => {
      const lease = store.get(leaseId);
      if (!lease || lease.state !== "open") return null;
      const handle = await handleFor(lease, live);
      if (!handle) return null;
      const buf = Buffer.from(await handle.screenshot({ format: "jpeg", quality: 60 }));
      return buf.toString("base64");
    },
  });
}

// pathToFileURL, not string concatenation: a space in the path percent-encodes in
// import.meta.url but not in argv, and the naive compare silently never runs main()
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("gateway failed to start:", e.message); process.exit(1); });
}

export { app, store, main };
