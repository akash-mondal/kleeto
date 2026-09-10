/**
 * Where the work ends up.
 *
 * A machine rented by the second is gone when it goes back, and until now so was everything on
 * it: an agent would build the spreadsheet it was asked for, save it to /root, hand the desktop
 * back, and have nothing to give anyone. The receipt proved a file had existed and hashed it,
 * which is not the same as having the file.
 *
 * So each run gets a folder on Kleeto's own machine that outlives the rented one. The agent
 * copies finished work into it and the person watching downloads it. It is deliberately small
 * and deliberately temporary: this is a hand-off point, not storage, and treating it as storage
 * is how a demo box fills up with other people's spreadsheets.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MB = 1024 * 1024;

/** A name safe to sit in a directory and in a URL, derived from the one the agent chose. */
export function safeName(raw, fallback = "file") {
  const base = String(raw ?? "").split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+/, "").slice(0, 80);
  return clean || fallback;
}

export class Deliverables {
  /**
   * @param graceMs   how long a finished run's files outlive the last watcher. Not zero: a tab
   *                  closed by accident should not destroy the only copy of work someone paid
   *                  for, and a few minutes of disk is cheaper than that phone call.
   * @param maxAgeMs  the outside limit, watcher or no watcher.
   */
  constructor({ dir = "var/deliverables", perRunBytes = 40 * MB, graceMs = 30 * 60_000,
                maxAgeMs = 6 * 60 * 60_000 } = {}) {
    this.dir = dir;
    this.perRunBytes = perRunBytes;
    this.graceMs = graceMs;
    this.maxAgeMs = maxAgeMs;
    this.seen = new Map();          // jobId -> when a watcher was last here
    mkdirSync(dir, { recursive: true });
  }

  #run(jobId) { return join(this.dir, safeName(jobId, "run")); }

  /** A watcher is on the page. Keeps the folder alive while somebody is looking at it. */
  touch(jobId) { this.seen.set(jobId, Date.now()); }

  list(jobId) {
    const d = this.#run(jobId);
    if (!existsSync(d)) return [];
    return readdirSync(d).filter((f) => !f.startsWith(".")).map((name) => {
      const s = statSync(join(d, name));
      return { name, bytes: s.size, at: s.mtimeMs };
    }).sort((a, b) => a.at - b.at);
  }

  used(jobId) { return this.list(jobId).reduce((n, f) => n + f.bytes, 0); }

  put(jobId, name, buffer) {
    const d = this.#run(jobId);
    mkdirSync(d, { recursive: true });
    if (this.used(jobId) + buffer.length > this.perRunBytes) {
      throw Object.assign(
        new Error(`this run's hand-off folder is full (${Math.round(this.perRunBytes / MB)}MB)`),
        { status: 413 });
    }
    const file = safeName(name);
    writeFileSync(join(d, file), buffer);
    this.touch(jobId);
    return {
      name: file,
      bytes: buffer.length,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      at: Date.now(),
    };
  }

  read(jobId, name) {
    const f = join(this.#run(jobId), safeName(name));
    if (!existsSync(f)) return null;
    this.touch(jobId);
    return readFileSync(f);
  }

  /**
   * Throw away what nobody is coming back for.
   *
   * `isDone` lets a run that is still working keep its files regardless of whether anyone has
   * the tab open — an agent mid-job is still going to produce something.
   */
  sweep(isDone = () => true) {
    if (!existsSync(this.dir)) return 0;
    const now = Date.now();
    let dropped = 0;
    for (const jobId of readdirSync(this.dir)) {
      const d = join(this.dir, jobId);
      let newest = 0;
      try { for (const f of readdirSync(d)) newest = Math.max(newest, statSync(join(d, f)).mtimeMs); }
      catch { continue; }
      const watched = this.seen.get(jobId) ?? newest;
      const old = now - newest > this.maxAgeMs;
      const abandoned = isDone(jobId) && now - watched > this.graceMs;
      if (old || abandoned) {
        rmSync(d, { recursive: true, force: true });
        this.seen.delete(jobId);
        dropped++;
      }
    }
    return dropped;
  }
}

/**
 * Pull a file off a rented machine, in pieces.
 *
 * The control channel is a shell, so a file comes back base64 through stdout, and one round trip
 * for a ten megabyte file is a ten megabyte line. Chunks keep each command a sane size and let a
 * big file arrive without anything having to buffer the whole of it as text.
 */
export async function fetchFromMachine(handle, path, { maxBytes = 40 * MB, chunk = 384 * 1024 } = {}) {
  const q = `'${String(path).replace(/'/g, `'\\''`)}'`;
  const size = Number(String(await handle.sh(`stat -c %s ${q}`)).trim());
  if (!Number.isFinite(size) || size <= 0) {
    throw Object.assign(new Error(`${path} is not a readable file on that machine`), { status: 404 });
  }
  if (size > maxBytes) {
    throw Object.assign(
      new Error(`${path} is ${(size / MB).toFixed(1)}MB; the hand-off folder takes files up to ${Math.round(maxBytes / MB)}MB`),
      { status: 413 });
  }
  const parts = [];
  for (let i = 0; i * chunk < size; i++) {
    const b64 = String(await handle.sh(
      `dd if=${q} bs=${chunk} skip=${i} count=1 status=none | base64 -w0`)).trim();
    parts.push(Buffer.from(b64, "base64"));
  }
  const buf = Buffer.concat(parts);
  if (buf.length !== size) {
    throw new Error(`read ${buf.length} bytes of ${path} but it is ${size}`);
  }
  return buf;
}
