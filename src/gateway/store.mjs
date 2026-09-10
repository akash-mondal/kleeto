/**
 * Lease state, durable across a restart.
 *
 * A lease is money: an agent has paid for seconds it has not spent yet. Losing that table to
 * a process restart would mean either charging twice or handing out free machines, so every
 * mutation is written through to disk before it is acknowledged. A JSON file is enough at
 * this size and has the virtue that the whole ledger can be read with `cat`.
 */
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

export const newId = (prefix) => `${prefix}_${randomBytes(9).toString("base64url")}`;

export class Store {
  constructor({ path = "var/leases.json" } = {}) {
    this.path = path;
    this.leases = new Map();
    mkdirSync(dirname(path), { recursive: true });
    if (existsSync(path)) {
      try {
        for (const l of JSON.parse(readFileSync(path, "utf8"))) this.leases.set(l.id, l);
      } catch (e) {
        // A corrupt ledger must not be silently replaced with an empty one.
        throw new Error(`lease store at ${path} is unreadable: ${e.message}`);
      }
    }
  }

  /** Written to a sibling then renamed, so a crash mid-write cannot truncate the ledger. */
  #flush() {
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify([...this.leases.values()], null, 1));
    renameSync(tmp, this.path);
  }

  get(id) { return this.leases.get(id); }
  all() { return [...this.leases.values()]; }
  open() { return this.all().filter((l) => l.state === "open" || l.state === "paused"); }

  put(lease) {
    this.leases.set(lease.id, lease);
    this.#flush();
    return lease;
  }

  patch(id, fields) {
    const l = this.leases.get(id);
    if (!l) return null;
    Object.assign(l, fields, { updatedAt: new Date().toISOString() });
    this.#flush();
    return l;
  }

  /** Find a lease by the opaque token in a viewer URL. Constant work, small table. */
  byViewToken(token) {
    if (!token) return null;
    return this.all().find((l) => l.viewToken === token) ?? null;
  }
}
