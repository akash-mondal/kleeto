/**
 * The job queue.
 *
 * Several people can ask for work at once, and the machines they need are finite: the upstream
 * plan allows two desktops at a time, and the VM that runs the agents has two cores. So a third
 * request cannot quietly become a third machine. It queues, and the person is told where they
 * are in the line rather than watching a spinner that means nothing.
 *
 * The queue is the honest shape for this. Rejecting the third caller would be simpler and would
 * make the product look broken; pretending to run it would take money for a machine that never
 * comes up.
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { EventEmitter } from "node:events";

export const JOB_STATES = ["queued", "claimed", "running", "done", "failed", "cancelled"];

export class JobQueue extends EventEmitter {
  /**
   * @param opts.concurrency  how many may run at once. Two, because that is what the upstream
   *                          plan and this VM can actually carry; raising it past the real
   *                          ceiling turns a queue into a pile of failures.
   */
  constructor({ path = "var/jobs.json", concurrency = 2, staleMs = 45 * 60_000 } = {}) {
    super();
    this.path = path;
    this.concurrency = concurrency;
    this.staleMs = staleMs;
    this.jobs = new Map();
    mkdirSync(path.replace(/\/[^/]+$/, "") || ".", { recursive: true });
    if (existsSync(path)) {
      try { for (const j of JSON.parse(readFileSync(path, "utf8"))) this.jobs.set(j.id, j); }
      catch { /* a corrupt queue starts empty rather than refusing to boot */ }
    }
    // Anything left mid-flight by a restart is not running any more, whatever the file says.
    for (const j of this.jobs.values()) {
      if (j.state === "claimed" || j.state === "running") {
        j.state = "queued"; j.note = "requeued after a restart"; j.claimedAt = null;
      }
    }
    this.#flush();
  }

  #flush() {
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify([...this.jobs.values()], null, 1));
    renameSync(tmp, this.path);
  }

  running() { return [...this.jobs.values()].filter((j) => j.state === "claimed" || j.state === "running"); }
  queued() { return [...this.jobs.values()].filter((j) => j.state === "queued").sort((a, b) => a.at - b.at); }

  submit({ prompt, image, lane, agent, effort, asset, by }) {
    const job = {
      id: `job_${randomBytes(6).toString("base64url")}`,
      prompt: String(prompt).slice(0, 4000),
      image: image ?? null, lane: lane ?? null,
      agent: agent ?? null, effort: effort ?? null, asset: asset ?? "usdc",
      by: by ?? null,
      state: "queued", at: Date.now(),
      claimedAt: null, startedAt: null, endedAt: null,
      leaseId: null, liveUrl: null, settlement: null, result: null,
      /* the conversation, and where it has got to. A job is not a command any more: the
         agent looks at what Kleeto has, says what it could do with it, and only starts
         once the person has agreed to a plan. */
      phase: "queued",
      messages: [{ role: "user", kind: "note", text: String(prompt).slice(0, 4000), at: Date.now() }],
      pending: null,
      answers: {},
      plan: null,
      events: [],
    };
    this.jobs.set(job.id, job);
    this.#flush();
    this.emit("submitted", this.view(job.id));
    return this.view(job.id);
  }

  /**
   * Hand the next job to a worker, if there is room. Returns null when the queue is empty or
   * the machines are all busy, which is the worker's cue to wait rather than to retry harder.
   */
  claim(worker) {
    this.#reap();
    if (this.running().length >= this.concurrency) return null;
    const next = this.queued()[0];
    if (!next) return null;
    next.state = "claimed";
    next.claimedAt = Date.now();
    next.worker = worker ?? "unknown";
    this.#flush();
    this.emit("claimed", this.view(next.id));
    return next;
  }

  update(id, fields) {
    const j = this.jobs.get(id);
    if (!j) return null;
    Object.assign(j, fields);
    if (fields.state === "running" && !j.startedAt) j.startedAt = Date.now();
    if (fields.state === "running" && j.phase === "queued") j.phase = "scanning";
    if (["done", "failed", "cancelled"].includes(fields.state)) { j.endedAt = Date.now(); j.phase = "ended"; j.pending = null; }
    this.#flush();
    this.emit("updated", this.view(id));
    return this.view(id);
  }

  /* ------------------------------------------------------------ the conversation ---- */

  /**
   * Something the agent wants the watcher to know, which does not need an answer.
   *
   * Narration is not decoration here: the agent spends real money a few seconds after it
   * starts, and a person who cannot see what it decided cannot stop it in time.
   */
  say(id, { role = "agent", text, kind = "note" }) {
    const j = this.jobs.get(id);
    if (!j) return null;
    j.messages.push({ role, kind, text: String(text).slice(0, 6000), at: Date.now() });
    if (j.phase === "scanning" || j.phase === "queued") j.phase = "talking";
    this.#flush();
    this.emit("message", { id, message: j.messages.at(-1), phase: j.phase });
    return j.messages.at(-1);
  }

  /**
   * A question the run cannot continue past.
   *
   * `kind` is "question" while the agent is still working out what is wanted, and "plan" for
   * the last one, which is the agent asking to begin. They are the same mechanism because
   * they are the same promise: nothing happens until the person answers.
   */
  ask(id, { text, kind = "question", options = null }) {
    const j = this.jobs.get(id);
    if (!j) return null;
    /* An agent whose tool call timed out waiting will ask the same thing again. That is the
       same question, not a new one: hand back the pending one so the person is not shown two
       copies of it and does not answer a question that nobody is listening to any more. */
    if (j.pending && j.pending.text === String(text).slice(0, 6000)) return j.pending;
    const qid = `q_${randomBytes(4).toString("base64url")}`;
    j.pending = { qid, kind, text: String(text).slice(0, 6000), options, at: Date.now() };
    j.messages.push({ role: "agent", kind, text: j.pending.text, options, qid, at: Date.now() });
    if (kind === "plan") j.plan = j.pending.text;
    j.phase = "talking";
    this.#flush();
    this.emit("message", { id, message: j.messages.at(-1), phase: j.phase, pending: j.pending });
    return j.pending;
  }

  /** The person's reply. For a plan, `approve` is what turns talk into a rented machine. */
  answer(id, { qid, text = "", approve = false }) {
    const j = this.jobs.get(id);
    if (!j) return null;
    const p = j.pending;
    if (!p || (qid && qid !== p.qid)) return null;
    const reply = { text: String(text).slice(0, 4000), approve, at: Date.now() };
    j.answers[p.qid] = reply;
    j.messages.push({ role: "user", kind: p.kind, text: reply.text || (approve ? "Start work." : ""), at: reply.at });
    j.pending = null;
    if (p.kind === "plan" && approve) j.phase = "working";
    this.#flush();
    this.emit("message", { id, message: j.messages.at(-1), phase: j.phase, pending: null });
    return reply;
  }

  /** What the agent's blocking tool call is waiting on. */
  reply(id, qid) {
    const j = this.jobs.get(id);
    return j?.answers[qid] ?? null;
  }

  /**
   * Money moving, kept next to the job that spent it.
   *
   * The gateway already knows every settlement; what it did not know was whose run it
   * belonged to. Recorded here, a watcher gets a ledger of their own run rather than a
   * global feed they have to pick their own payments out of.
   */
  record(id, event) {
    const j = this.jobs.get(id);
    if (!j) return null;
    const e = { at: Date.now(), ...event };
    j.events.push(e);
    if (j.events.length > 200) j.events.shift();
    this.#flush();
    this.emit("event", { id, event: e });
    return e;
  }

  /** Everything one watcher needs, in one shape: the talk, the money, the machine. */
  thread(id) {
    const j = this.jobs.get(id);
    if (!j) return null;
    return { ...this.view(id), phase: j.phase, plan: j.plan,
             messages: j.messages, pending: j.pending, events: j.events };
  }

  /** A worker that dies holding a job must not block the line for ever. */
  #reap() {
    const now = Date.now();
    for (const j of this.jobs.values()) {
      const since = j.claimedAt ?? 0;
      if ((j.state === "claimed" || j.state === "running") && now - since > this.staleMs) {
        j.state = "failed";
        j.note = "the worker stopped reporting";
        j.endedAt = now;
      }
    }
  }

  /** What a caller is shown: their position, and nothing about anyone else's prompt. */
  view(id) {
    const j = this.jobs.get(id);
    if (!j) return null;
    const ahead = j.state === "queued" ? this.queued().findIndex((q) => q.id === j.id) : 0;
    return {
      id: j.id, state: j.state, image: j.image, lane: j.lane,
      agent: j.agent, effort: j.effort, asset: j.asset,
      queuedAt: new Date(j.at).toISOString(),
      position: j.state === "queued" ? ahead + 1 : 0,
      leaseId: j.leaseId, liveUrl: j.liveUrl, settlement: j.settlement,
      seconds: j.startedAt ? Math.round(((j.endedAt ?? Date.now()) - j.startedAt) / 1000) : 0,
      result: j.result, note: j.note ?? null,
      phase: j.phase, pending: j.pending,
    };
  }

  /** The board, for anyone watching. Prompts are truncated: a queue is public, a job is not. */
  board() {
    this.#reap();
    const all = [...this.jobs.values()].sort((a, b) => b.at - a.at);
    return {
      concurrency: this.concurrency,
      running: this.running().length,
      queued: this.queued().length,
      capacity: `${this.running().length} of ${this.concurrency} machines busy`,
      jobs: all.slice(0, 20).map((j) => ({
        id: j.id, state: j.state, image: j.image, agent: j.agent, effort: j.effort,
        summary: j.prompt.slice(0, 80) + (j.prompt.length > 80 ? "…" : ""),
        seconds: j.startedAt ? Math.round(((j.endedAt ?? Date.now()) - j.startedAt) / 1000) : 0,
        liveUrl: j.state === "running" ? j.liveUrl : null,
        queuedAt: new Date(j.at).toISOString(),
      })),
    };
  }
}
