// Lane catalogue and pricing.
//
// A lane is one rentable shape of computer. Pricing is per SECOND held, because that is the
// unit the upstream provider bills us in and the unit the buyer can verify. One credit buys
// one second of one lane.
//
// creditTinybar is fixed at quote time and frozen onto the lease. It is never recomputed at
// payment time: a buyer signs for a price, and recomputing it server-side invalidates a
// correctly-signed payment.
import { hbarUsd } from "./networks.mjs";

/**
 * Upstream published per-unit costs, USD, on the Starter plan the key is on. Free tier is
 * 1.5x each of these, which is the "33% cheaper runtime" the plan advertises: the catalogue
 * was built on these numbers from the start, so the upgrade changed capability, not price.
 */
const COST = { vcpuHour: 0.035, gbHour: 0.011, screenHour: 0.02, browserHour: 0.10 };
const MARGIN = 1.10;

const perSec = (vcpu, gb, screen = false) =>
  (vcpu * COST.vcpuHour + gb * COST.gbHour + (screen ? COST.screenHour : 0)) / 3600;

/**
 * `family` decides which adapter method set a lease exposes:
 *   machine — commands, files, git, code, preview URLs   (headless)
 *   desktop — machine + screen, mouse/keyboard, VNC live view, mp4
 *   browser — a real Chrome driven over CDP, with session replay
 */
export const LANES = {
  "machine-1": { family: "machine", vcpu: 1, memGiB: 2,  costPerSecUsd: perSec(1, 2) },
  "machine-2": { family: "machine", vcpu: 2, memGiB: 4,  costPerSecUsd: perSec(2, 4) },
  "machine-4": { family: "machine", vcpu: 4, memGiB: 8,  costPerSecUsd: perSec(4, 8) },
  "machine-8": { family: "machine", vcpu: 8, memGiB: 16, costPerSecUsd: perSec(8, 16) },
  "desktop-2": { family: "desktop", vcpu: 2, memGiB: 4,  costPerSecUsd: perSec(2, 4, true),
                 resolution: "1280x720" },
  "desktop-4": { family: "desktop", vcpu: 4, memGiB: 8,  costPerSecUsd: perSec(4, 8, true),
                 resolution: "1920x1080" },
  "browser-fast": { family: "browser", pool: "fast", stealth: false,
                    costPerSecUsd: COST.browserHour / 3600 },
  // browser-stealth is deliberately absent. It is no longer plan-gated (the key is on
  // Starter as of 2026-09-07), but the pool has nothing in it: POST /sessions {stealth:true}
  // answers 503 "No stealth pool available", fleet empty, on every attempt. Upstream also
  // publishes no per-second number for it. A lane that cannot be served or measured is not
  // a lane; it ships when both hold.
};

/** Round to whole tinybar, never below 1 — sub-tinybar precision cannot be settled. */
function toTinybar(usd, usdPerHbar) {
  const tb = Math.ceil((usd / usdPerHbar) * 1e8);   // ceil: the seller never eats a fraction
  if (!Number.isFinite(tb) || tb < 1) {
    throw new Error(`unpriceable: ${usd} USD at ${usdPerHbar} USD/HBAR`);
  }
  return tb;
}

/**
 * Build a priced catalogue against the ledger's own exchange rate.
 * Cached briefly and collapsed, so a burst of quotes makes one mirror call.
 */
const rateCache = new Map();   // caip2 -> {at, rate, inflight}
export async function usdPerHbar(net, { ttlMs = 60_000, now = Date.now } = {}) {
  const hit = rateCache.get(net.caip2);
  if (hit?.inflight) return hit.inflight;
  if (hit && now() - hit.at < ttlMs) return hit.rate;
  const inflight = hbarUsd(net).then((rate) => {
    rateCache.set(net.caip2, { at: now(), rate });
    return rate;
  }).catch((e) => { rateCache.delete(net.caip2); throw e; });
  rateCache.set(net.caip2, { ...hit, inflight });
  return inflight;
}

export async function catalogue(net, opts) {
  const rate = await usdPerHbar(net, opts);
  const lanes = {};
  for (const [id, spec] of Object.entries(LANES)) {
    const priceUsdPerSec = spec.costPerSecUsd * MARGIN;
    lanes[id] = {
      id,
      ...spec,
      creditTinybar: toTinybar(priceUsdPerSec, rate),
      usdPerHour: +(priceUsdPerSec * 3600).toFixed(4),
    };
  }
  return { network: net.caip2, usdPerHbar: rate, marginPct: +((MARGIN - 1) * 100).toFixed(2), lanes };
}

export function requireLane(id) {
  const spec = LANES[id];
  if (!spec) {
    throw new Error(`unknown lane ${id}; available: ${Object.keys(LANES).join(", ")}`);
  }
  return spec;
}
