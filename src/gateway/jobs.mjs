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

  submit({ prompt, image, lane, by }) {
    const job = {
      id: `job_${randomBytes(6).toString("base64url")}`,
      prompt: String(prompt).slice(0, 4000),
      image: image ?? null, lane: lane ?? null,
      by: by ?? null,
      state: "queued", at: Date.now(),
      claimedAt: null, startedAt: null, endedAt: null,
      leaseId: null, liveUrl: null, settlement: null, result: null,
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
    if (["done", "failed", "cancelled"].includes(fields.state)) j.endedAt = Date.now();
    this.#flush();
    this.emit("updated", this.view(id));
    return this.view(id);
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
      queuedAt: new Date(j.at).toISOString(),
      position: j.state === "queued" ? ahead + 1 : 0,
      leaseId: j.leaseId, liveUrl: j.liveUrl, settlement: j.settlement,
      seconds: j.startedAt ? Math.round(((j.endedAt ?? Date.now()) - j.startedAt) / 1000) : 0,
      result: j.result, note: j.note ?? null,
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
        id: j.id, state: j.state, image: j.image,
        summary: j.prompt.slice(0, 80) + (j.prompt.length > 80 ? "…" : ""),
        seconds: j.startedAt ? Math.round(((j.endedAt ?? Date.now()) - j.startedAt) / 1000) : 0,
        liveUrl: j.state === "running" ? j.liveUrl : null,
        queuedAt: new Date(j.at).toISOString(),
      })),
    };
  }
}
