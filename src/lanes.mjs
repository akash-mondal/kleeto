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

/**
 * The maximum-stealth browser comes from a second supplier, browser-use, because the first
 * one's stealth fleet has never had capacity (see research/kleeto-solari-surface.md §C).
 * Measured 2026-09-10: it clears Cloudflare, PerimeterX, openai.com and indeed where the
 * fast pool gets a 403, with residential egress and automatic CAPTCHA solving on by default.
 */
const STEALTH_COST = { browserHour: 0.02, proxyGb: 5.00 };

/**
 * Bandwidth is the whole cost of that lane and it is billed per gigabyte, which a per-second
 * quote cannot absorb: one measured session moved 63 MB and was billed $0.31 of proxy against
 * $0.0003 of browser time. So the lane carries a hard ceiling. The quote assumes this budget,
 * the lease stops at the cap, and the agent signs for a price it can actually be held to.
 */
const STEALTH_MB_PER_MIN = 5;      // measured: 37.7 MB over a five-site run
const STEALTH_MB_CEILING = 250;    // ~50 min at the budgeted rate; the lease halts here

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
  // The everyday browser: a flat upstream rate with no bandwidth meter behind it, so a long
  // lease can never cost more than its seconds. Blocked by Cloudflare and friends.
  "browser-fast": { family: "browser", vendor: "solari", pool: "fast", stealth: false,
                    costPerSecUsd: COST.browserHour / 3600 },
  // The escalation, for when a site turns the fast pool away. Everything on: hardened
  // Chromium, residential proxy, automatic CAPTCHA. About nineteen times the fast pool per
  // second, essentially all of it bandwidth, which is why it is a separate lane the agent
  // opts into after a 403 rather than a default anyone pays for by accident.
  "browser-max": { family: "browser", vendor: "browser-use", stealth: true, captcha: true,
                   residential: true, mbCeiling: STEALTH_MB_CEILING,
                   costPerSecUsd: STEALTH_COST.browserHour / 3600
                                + (STEALTH_MB_PER_MIN / 60 / 1024) * STEALTH_COST.proxyGb },
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
