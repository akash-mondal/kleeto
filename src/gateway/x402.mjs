/**
 * The x402 handshake, spoken directly to Blocky402.
 *
 * The middleware in `@x402/hono` takes a static route table, and Kleeto's price is not static:
 * it is seconds x the lane's per-second rate, quoted against the ledger's own HBAR rate at the
 * moment of the quote. So the protocol is implemented here instead, which also makes the
 * two-asset offer explicit rather than a side effect of a config file.
 *
 * Both assets are always offered. A 402 carries one `accepts` entry for USDC and one for HBAR,
 * and the agent picks whichever it holds; nothing upstream has to be swapped first.
 */
import { HBAR_ASSET } from "../networks.mjs";

export const X402_VERSION = 2;
const USDC_DECIMALS = 6;
const HBAR_DECIMALS = 8;      // tinybar

/**
 * Atomic units for a price given in tinybar.
 *
 * HBAR is quoted natively. USDC is converted through the same ledger rate the catalogue was
 * priced with, so the two `accepts` entries are worth the same thing at quote time and an
 * agent is never punished for holding one rather than the other.
 */
export function priceInAssets({ tinybar, usdPerHbar }) {
  const usd = (tinybar / 10 ** HBAR_DECIMALS) * usdPerHbar;
  return {
    hbar: String(Math.ceil(tinybar)),
    usdc: String(Math.max(1, Math.ceil(usd * 10 ** USDC_DECIMALS))),
    usd,
  };
}

/**
 * The body of a 402. `feePayer` is whatever the facilitator advertised for this network at
 * boot: it is never a constant, because the two networks use different accounts and hardcoding
 * it is exactly what makes a mainnet flip a refactor instead of a flag.
 */
export function buildChallenge({ net, payTo, feePayer, resource, description, tinybar, usdPerHbar, maxTimeoutSeconds = 120 }) {
  const price = priceInAssets({ tinybar, usdPerHbar });
  const common = { scheme: "exact", network: net.caip2, resource, description, mimeType: "application/json", payTo, maxTimeoutSeconds };
  return {
    x402Version: X402_VERSION,
    accepts: [
      { ...common, maxAmountRequired: price.usdc, asset: net.usdc,
        extra: { feePayer, name: "USDC", decimals: USDC_DECIMALS, symbol: "USDC" } },
      { ...common, maxAmountRequired: price.hbar, asset: HBAR_ASSET,
        extra: { feePayer, name: "HBAR", decimals: HBAR_DECIMALS, symbol: "HBAR" } },
    ],
    error: "payment required",
  };
}

/** The `X-PAYMENT` header is base64 JSON; a malformed one is the client's fault, not a 500. */
export function decodePaymentHeader(header) {
  if (!header) return null;
  try {
    const payload = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    if (!payload?.scheme || !payload?.network) return null;
    return payload;
  } catch {
    return null;
  }
}

export class Facilitator {
  constructor(net, { fetchImpl = fetch } = {}) {
    this.net = net;
    this.base = net.facilitator;
    this.fetch = fetchImpl;
  }

  async #post(path, body) {
    const r = await this.fetch(this.base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text.slice(0, 300) }; }
    return { ok: r.ok, status: r.status, body: json };
  }

  /** Does this payment satisfy these requirements? Never settles. */
  verify(paymentPayload, paymentRequirements) {
    return this.#post("/verify", { x402Version: X402_VERSION, paymentPayload, paymentRequirements });
  }

  /** Submit it. The facilitator pays the network fee, which is why the agent needs no HBAR for gas. */
  settle(paymentPayload, paymentRequirements) {
    return this.#post("/settle", { x402Version: X402_VERSION, paymentPayload, paymentRequirements });
  }
}

/**
 * Match the requirements the client actually paid against. A client may answer a two-asset
 * challenge with either one, so the offer it chose has to be found rather than assumed, and
 * a payload naming an asset that was never offered is rejected instead of being verified
 * against the wrong entry.
 */
export function matchRequirements(challenge, payload) {
  const asset = payload?.payload?.asset ?? payload?.asset;
  const candidates = challenge.accepts.filter(
    (a) => a.scheme === payload.scheme && a.network === payload.network,
  );
  if (!candidates.length) return null;
  if (!asset) return candidates[0];
  return candidates.find((a) => a.asset === asset) ?? null;
}
