/**
 * browser-use, the maximum-stealth browser lane.
 *
 * Reached only through this file, and nothing it returns is handed to a client: the CDP URL
 * and the vendor's own live page are credentials in all but name, and they carry the vendor's
 * hostname. The gateway hands out its own ids and its own viewer.
 */
const BASE = "https://api.browser-use.com/api/v2";

export class BrowserUseAdapter {
  constructor({ apiKey, baseUrl = BASE } = {}) {
    if (!apiKey) throw new Error("browser-use: apiKey required");
    this.key = apiKey;
    this.base = baseUrl;
  }

  async #call(path, { method = "GET", body } = {}) {
    const r = await fetch(this.base + path, {
      method,
      headers: { "X-Browser-Use-API-Key": this.key, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await r.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!r.ok) {
      const e = new Error(`browser-use ${r.status}: ${JSON.stringify(json).slice(0, 200)}`);
      e.status = r.status;
      throw e;
    }
    return json;
  }

  /**
   * A browser with the full stealth stack on. `residential` picks the egress: the paid
   * proxy network, or a datacenter address that still clears Cloudflare because the
   * hardened Chromium is what does the work.
   */
  async provision(lane, { timeoutMinutes = 60, residential = true, country = "us" } = {}) {
    const startedAt = Date.now();
    const b = await this.#call("/browsers", {
      method: "POST",
      body: {
        timeout: Math.min(timeoutMinutes, 240),
        // null is meaningful here: it is what moves egress off the metered proxy network
        proxyCountryCode: residential ? country : null,
      },
    });
    return new BrowserUseLease(this, b, { lane, startedAt });
  }

  get(id) { return this.#call(`/browsers/${id}`); }
  stop(id) { return this.#call(`/browsers/${id}`, { method: "PATCH", body: { action: "stop" } }); }
  async account() { return this.#call("/billing/account"); }
}

export class BrowserUseLease {
  constructor(adapter, raw, { lane, startedAt }) {
    this.a = adapter;
    this.vendorId = raw.id;
    this.lane = lane;
    this.startedAt = startedAt;
    /** Upstream endpoints. Internal only: never serialised toward a client. */
    this.upstream = { cdp: raw.cdpUrl, live: raw.liveUrl };
  }

  /** Bandwidth is what this lane actually costs, so the meter has to read it. */
  async usage() {
    const b = await this.a.get(this.vendorId).catch(() => ({}));
    return {
      state: b.status ?? "unknown",
      mb: Number(b.proxyUsedMb ?? 0),
      upstreamUsd: Number(b.browserCost ?? 0) + Number(b.proxyCost ?? 0),
    };
  }

  async terminate() {
    const fin = await this.a.stop(this.vendorId).catch(() => ({}));
    return {
      mb: Number(fin.proxyUsedMb ?? 0),
      upstreamUsd: Number(fin.browserCost ?? 0) + Number(fin.proxyCost ?? 0),
    };
  }
}
