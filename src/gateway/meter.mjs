/**
 * The meter.
 *
 * x402's `exact` scheme pays once for one thing. Kleeto sells seconds, which never stop
 * arriving. Bridging those two is the whole problem, and there are three ways to do it:
 *
 *   1. Prepay a block of seconds. Simple, but it is not metering: the agent guesses how long
 *      the job takes and overpays or gets cut off.
 *   2. Pay per tick. Honest, but a settlement every second is thousands of transactions an
 *      hour and the ledger's finality is slower than the tick.
 *   3. Pay into a balance, meter against the balance every second, ask for more when it runs
 *      low. On-chain when money moves, per-second where the product's promise is.
 *
 * This is (3), with the part that makes it verifiable: every tick is hash-chained to the one
 * before it, so the run of seconds cannot be rewritten after the fact, and the chain head is
 * anchored to a public topic periodically rather than every second. A buyer recomputes the
 * chain from the ticks and checks the head against the ledger. The bill is not a number we
 * assert; it is a number anyone can derive.
 */
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Genesis for a lease's chain: binds it to the lease and the price it agreed to. */
export const genesis = (lease) =>
  sha(`kleeto/v1|${lease.id}|${lease.lane}|${lease.creditTinybar}|${lease.startedAt}`);

/**
 * One second of one lease. `prev` makes the sequence tamper-evident: change any earlier tick
 * and every hash after it moves, so a disputed bill is settled by arithmetic.
 */
export function tickHash({ prev, seq, leaseId, tinybar, at }) {
  return sha(`${prev}|${seq}|${leaseId}|${tinybar}|${at}`);
}

/**
 * A funded session. One agent, one balance, many leases.
 *
 * The balance is in tinybar because that is the unit that was actually settled; converting to
 * a display currency is the UI's job and doing it here would bake a stale rate into the ledger.
 */
export class Session {
  constructor({ id, balanceTinybar = 0 }) {
    this.id = id;
    this.balanceTinybar = balanceTinybar;
    this.spentTinybar = 0;
    this.topUps = [];
  }
  credit(tinybar, { transaction, asset } = {}) {
    this.balanceTinybar += tinybar;
    this.topUps.push({ tinybar, transaction, asset, at: new Date().toISOString() });
    return this.balanceTinybar;
  }
  debit(tinybar) {
    const taken = Math.min(tinybar, this.balanceTinybar);
    this.balanceTinybar -= taken;
    this.spentTinybar += taken;
    return taken;
  }
}

/**
 * Drives every open lease one second at a time.
 *
 * Emits as it goes so a UI can watch the money move. The events are the product: `tick` is the
 * meter running, `low` is the moment the agent must pay again, `paused` is what happens if it
 * does not, and none of them are decoration over a number computed elsewhere.
 */
export class Meter extends EventEmitter {
  /**
   * @param opts.lowWaterSeconds  ask for more once the balance buys less than this
   * @param opts.anchorEverySec   how often the chain head goes to the public topic
   */
  constructor({ store, lowWaterSeconds = 60, anchorEverySec = 60, onAnchor, ledgerDir = "var/ticks" } = {}) {
    super();
    this.store = store;
    /**
     * Ticks are appended to a file per lease as they happen.
     *
     * They used to live only in memory, and a restart during a run lost the evidence for a
     * lease that had genuinely been metered: the machine was billed for 724 seconds and the
     * proof endpoint reported none. An append-only file is the smallest thing that makes the
     * chain survive the process that wrote it, and it is also the honest shape for a ledger.
     */
    this.ledgerDir = ledgerDir;
    mkdirSync(ledgerDir, { recursive: true });
    this.lowWater = lowWaterSeconds;
    this.anchorEvery = anchorEverySec;
    this.onAnchor = onAnchor;
    this.sessions = new Map();
    this.runs = new Map();      // leaseId -> { seq, prev, sinceAnchor, ticks }
    this.timer = null;
  }

  session(id) {
    if (!this.sessions.has(id)) this.sessions.set(id, new Session({ id }));
    return this.sessions.get(id);
  }

  /** Begin metering a lease that is already paid for and up. */
  start(lease) {
    this.runs.set(lease.id, {
      seq: 0,
      prev: genesis(lease),
      head: genesis(lease),
      sinceAnchor: 0,
      ticks: [],
      lane: lease.lane,
      rate: lease.creditTinybar,
      sessionId: lease.sessionId,
    });
    this.emit("open", { leaseId: lease.id, lane: lease.lane, rate: lease.creditTinybar, chain: genesis(lease) });
    if (!this.timer) this.timer = setInterval(() => this.#pump(), 1000).unref?.() ?? setInterval(() => this.#pump(), 1000);
    return this.runs.get(lease.id);
  }

  stop(leaseId) {
    const run = this.runs.get(leaseId);
    this.runs.delete(leaseId);
    if (!this.runs.size && this.timer) { clearInterval(this.timer); this.timer = null; }
    return run;
  }

  state(leaseId) {
    const run = this.runs.get(leaseId);
    if (!run) return null;
    const s = this.sessions.get(run.sessionId);
    return {
      seconds: run.seq,
      spentTinybar: run.seq * run.rate,
      rateTinybar: run.rate,
      chainHead: run.head,
      balanceTinybar: s?.balanceTinybar ?? 0,
      secondsRemaining: s ? Math.floor(s.balanceTinybar / run.rate) : 0,
    };
  }

  /** One pass over every running lease. Called once a second. */
  #pump() {
    const at = new Date().toISOString();
    for (const [leaseId, run] of this.runs) {
      const lease = this.store.get(leaseId);
      if (!lease || lease.state !== "open") continue;
      const s = this.session(run.sessionId);

      if (s.balanceTinybar < run.rate) {
        this.emit("exhausted", { leaseId, at, balanceTinybar: s.balanceTinybar });
        this.store.patch(leaseId, { state: "paused", pausedReason: "balance exhausted" });
        continue;
      }

      const taken = s.debit(run.rate);
      run.seq += 1;
      run.head = tickHash({ prev: run.prev, seq: run.seq, leaseId, tinybar: taken, at });
      run.prev = run.head;
      run.sinceAnchor += 1;
      const tick = { seq: run.seq, tinybar: taken, at, hash: run.head };
      run.ticks.push(tick);
      this.#append(leaseId, tick);

      this.emit("tick", {
        leaseId, seq: run.seq, at,
        tinybar: taken,
        spentTinybar: run.seq * run.rate,
        balanceTinybar: s.balanceTinybar,
        secondsRemaining: Math.floor(s.balanceTinybar / run.rate),
        chainHead: run.head,
      });

      const left = Math.floor(s.balanceTinybar / run.rate);
      if (left <= this.lowWater && left % 10 === 0) {
        this.emit("low", { leaseId, sessionId: s.id, secondsRemaining: left, balanceTinybar: s.balanceTinybar });
      }

      if (run.sinceAnchor >= this.anchorEvery) {
        run.sinceAnchor = 0;
        const anchor = { leaseId, seq: run.seq, head: run.head, at };
        this.emit("anchor", anchor);
        this.onAnchor?.(anchor);
      }
    }
  }

  #append(leaseId, tick) {
    try { appendFileSync(`${this.ledgerDir}/${leaseId}.jsonl`, JSON.stringify(tick) + "\n"); }
    catch { /* a full disk must not stop the meter; the chain head is still in memory */ }
  }

  /** Every tick ever written for a lease, whichever process wrote it. */
  ledger(leaseId) {
    const f = `${this.ledgerDir}/${leaseId}.jsonl`;
    if (!existsSync(f)) return [];
    return readFileSync(f, "utf8").split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  }

  /**
   * The evidence for a closed lease. The ticks are the working; the root is what gets signed
   * and what the public topic holds, so a buyer can recompute one from the other.
   */
  proof(leaseId) {
    const run = this.runs.get(leaseId);
    if (!run) {
      // the lease closed, or this process did not meter it; the file still has the chain
      const ticks = this.ledger(leaseId);
      if (!ticks.length) return null;
      return {
        seconds: ticks.length,
        rateTinybar: ticks[0]?.tinybar ?? 0,
        totalTinybar: ticks.reduce((n, t) => n + t.tinybar, 0),
        chainHead: ticks[ticks.length - 1].hash,
        ticks,
      };
    }
    return {
      seconds: run.seq,
      rateTinybar: run.rate,
      totalTinybar: run.seq * run.rate,
      chainHead: run.head,
      genesis: run.ticks.length ? undefined : run.prev,
      ticks: run.ticks,
    };
  }
}

/** Recompute a chain from its ticks. This is what a buyer runs; it must not need the server. */
export function verifyChain({ genesisHash, leaseId, ticks }) {
  let prev = genesisHash;
  for (const t of ticks) {
    const expect = tickHash({ prev, seq: t.seq, leaseId, tinybar: t.tinybar, at: t.at });
    if (expect !== t.hash) return { ok: false, brokeAt: t.seq };
    prev = expect;
  }
  return { ok: true, head: prev, seconds: ticks.length,
           totalTinybar: ticks.reduce((n, t) => n + t.tinybar, 0) };
}
