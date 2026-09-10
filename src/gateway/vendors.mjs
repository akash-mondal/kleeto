/**
 * The white-label boundary.
 *
 * Every upstream supplier is reached through this file and nothing else, and the only thing
 * it ever returns to the rest of the gateway is a lease shaped the same way regardless of who
 * is behind it. Vendor identity, vendor ids and vendor URLs stop here.
 *
 * `publicView()` is the enforcement point: it is the one function the HTTP layer may call to
 * turn a lease into something a client sees, and it is built by allowlist rather than by
 * deleting fields, because a deny-list drifts the moment a supplier adds a field.
 */
import { SolariAdapter } from "../adapters/solari.mjs";
import { BrowserUseAdapter } from "../adapters/browser-use.mjs";
import { requireLane } from "../lanes.mjs";
import { resolveImage } from "../images.mjs";

let solari = null;
let browserUse = null;

function solariAdapter() {
  if (!solari) {
    const apiKey = process.env.SOLARI_API_KEY;
    if (!apiKey) throw new Error("SOLARI_API_KEY is not set");
    solari = new SolariAdapter({ apiKey });
  }
  return solari;
}
function browserUseAdapter() {
  if (!browserUse) {
    const apiKey = process.env.BROWSER_USE_API_KEY;
    if (!apiKey) throw new Error("BROWSER_USE_API_KEY is not set");
    browserUse = new BrowserUseAdapter({ apiKey });
  }
  return browserUse;
}

/**
 * Bring a lane up. Returns `{ handle, upstream }` where `upstream` never leaves the server:
 * it holds the supplier's own endpoints, which carry the supplier's hostname and, in the
 * browser case, an unauthenticated control channel to a live browser.
 */
export async function provision(laneId, { seconds, metadata, image } = {}) {
  const lane = requireLane(laneId);
  const timeoutMs = Math.ceil((seconds ?? 600) * 1000) + 60_000;   // upstream outlives the meter briefly

  if (lane.vendor === "browser-use") {
    const lease = await browserUseAdapter().provision(lane, {
      timeoutMinutes: Math.ceil(timeoutMs / 60000),
      residential: lane.residential !== false,
    });
    return {
      handle: lease,
      kind: "browser",
      upstream: lease.upstream,
      vendorId: lease.vendorId,
      vendor: "browser-use",
    };
  }

  // everything else is Solari: machine, desktop, and the everyday browser
  const a = solariAdapter();
  if (lane.family === "browser") {
    const s = await a.browser({ pool: lane.pool ?? "fast" });
    return {
      handle: s, kind: "browser", vendor: "solari", vendorId: s.sessionId ?? s.id,
      upstream: { cdp: s.cdpEndpoint, ws: s.wsEndpoint },
    };
  }
  // A desktop can boot a prepared image instead of the stock template. The image decides what
  // software is on the machine; the lane decides how much machine, and only the lane is priced.
  const fromSnapshot = lane.family === "desktop" ? resolveImage(image) : null;
  const lease = await a.provision({ id: laneId, ...lane },
    { timeoutMs, metadata, ...(fromSnapshot ? { fromSnapshot } : {}) });
  return {
    handle: lease, kind: lane.family, vendor: "solari", vendorId: lease.id,
    image: image ?? "base",
    upstream: { stream: lease.streamUrl },
  };
}

/** Stop the upstream machine and report whatever the supplier charged us. */
export async function terminate(record) {
  try {
    if (record.vendor === "browser-use") {
      const a = browserUseAdapter();
      const fin = await a.stop(record.vendorId).catch(() => ({}));
      return { mb: Number(fin.proxyUsedMb ?? 0), upstreamUsd: Number(fin.browserCost ?? 0) + Number(fin.proxyCost ?? 0) };
    }
    const a = solariAdapter();
    if (record.kind === "browser") {
      await a.killBrowser?.(record.vendorId).catch(() => {});
      return {};
    }
    await a.sandboxes.kill(record.vendorId).catch(() => {});
    return {};
  } catch {
    return {};
  }
}

/**
 * The only shape a client is ever shown.
 *
 * Built field by field on purpose. If a supplier starts returning something new, it does not
 * appear here until someone writes the line, which is the correct default for a product whose
 * whole promise is that the machine is Kleeto's.
 */
export function publicView(l, { origin }) {
  return {
    id: l.id,
    lane: l.lane,
    kind: l.kind,
    image: l.image ?? "base",
    state: l.state,
    network: l.network,
    asset: l.asset,
    creditTinybar: l.creditTinybar,
    secondsPurchased: l.secondsPurchased,
    secondsUsed: l.secondsUsed ?? 0,
    startedAt: l.startedAt,
    expiresAt: l.expiresAt,
    ...(l.mbCeiling ? { mbCeiling: l.mbCeiling, mbUsed: l.mbUsed ?? 0 } : {}),
    // Ours, on our host. The supplier's own viewer is never linked.
    liveUrl: l.viewToken ? `${origin}/live/${l.viewToken}` : null,
    receiptUrl: `${origin}/v1/leases/${l.id}/receipt`,
  };
}

/** A guard for tests and for the smoke check: does any vendor string survive serialisation? */
export function leaksVendor(obj) {
  const s = JSON.stringify(obj ?? {}).toLowerCase();
  return ["solari", "browser-use", "browseruse", "getsolari", "browser_use", "cdp.browser"]
    .filter((needle) => s.includes(needle));
}
