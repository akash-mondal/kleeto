/**
 * Puts two browser vendors through the same anti-bot gauntlet and prints one table.
 *
 * The question this answers: for Kleeto's browser lane, does browser-use's cloud clear the
 * defended sites that Solari's fast pool cannot, now that Solari's stealth fleet has never
 * once had capacity?
 */
import { chromium } from "playwright-core";

const BU = process.env.BROWSER_USE_API_KEY;
const SOLARI = process.env.SOLARI_API_KEY;
const buHdr = { "X-Browser-Use-API-Key": BU, "Content-Type": "application/json" };
const solHdr = { Authorization: "Bearer " + SOLARI, "Content-Type": "application/json" };

/** Sites that actually turn agents away, plus a fingerprint mirror. */
const GAUNTLET = [
  ["sannysoft", "https://bot.sannysoft.com/"],
  ["cloudflare", "https://nowsecure.nl/"],
  ["openai.com", "https://openai.com/"],
  ["G2", "https://www.g2.com/"],
  ["indeed", "https://www.indeed.com/"],
];

async function makeBU({ proxy } = {}) {
  const body = { timeout: 10, ...(proxy ? { proxyCountryCode: proxy } : {}) };
  const r = await fetch("https://api.browser-use.com/api/v2/browsers", { method: "POST", headers: buHdr, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.cdpUrl) throw new Error("browser-use: " + JSON.stringify(j).slice(0, 200));
  return { cdp: j.cdpUrl, id: j.id, stop: () => fetch(`https://api.browser-use.com/api/v2/browsers/${j.id}`, { method: "PATCH", headers: buHdr, body: JSON.stringify({ action: "stop" }) }).catch(() => {}) };
}
async function makeSolari() {
  const r = await fetch("https://api.getsolari.com/sessions", { method: "POST", headers: solHdr, body: JSON.stringify({}) });
  const j = await r.json();
  if (!j.cdpEndpoint) throw new Error("solari: " + JSON.stringify(j).slice(0, 200));
  return { cdp: j.cdpEndpoint, id: j.sessionId, stop: () => fetch(`https://api.getsolari.com/sessions/${j.sessionId}`, { method: "DELETE", headers: solHdr }).catch(() => {}) };
}

/** A page is "through" if it rendered its own content rather than an interstitial. */
async function visit(page, url) {
  const t0 = Date.now();
  try {
    const resp = await page.goto(url, { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);                       // let a challenge resolve or bite
    const status = resp?.status() ?? 0;
    const { title, text, len } = await page.evaluate(() => ({
      title: document.title.slice(0, 60),
      text: document.body?.innerText?.replace(/\s+/g, " ").slice(0, 160) ?? "",
      len: document.body?.innerText?.length ?? 0,
    }));
    const blocked = /just a moment|verify you are human|attention required|access denied|are you a robot|unusual traffic|enable javascript and cookies|pardon our interruption/i.test(title + " " + text);
    return { ok: !blocked && status < 400 && len > 200, status, title, ms: Date.now() - t0, note: blocked ? "CHALLENGED" : "" };
  } catch (e) {
    return { ok: false, status: 0, title: "", ms: Date.now() - t0, note: e.message.slice(0, 40) };
  }
}

async function run(label, mk) {
  let h;
  try { h = await mk(); } catch (e) { return console.log(`\n### ${label}\n  could not create: ${e.message}`); }
  console.log(`\n### ${label}`);
  try {
    const b = await chromium.connectOverCDP(h.cdp, { timeout: 45000 });
    const ctx = b.contexts()[0] ?? await b.newContext();
    const page = ctx.pages()[0] ?? await ctx.newPage();
    const fp = await page.evaluate(() => ({
      ua: (navigator.userAgent.match(/Chrome\/[\d.]+/) ?? ["?"])[0],
      webdriver: navigator.webdriver, plugins: navigator.plugins.length,
      langs: navigator.languages.join(","), cores: navigator.hardwareConcurrency,
      mem: navigator.deviceMemory ?? "?", vendor: navigator.vendor,
    })).catch(() => ({}));
    const ip = await page.evaluate(async () => {
      try { const r = await fetch("https://ipinfo.io/json"); const j = await r.json(); return `${j.ip} ${j.org ?? ""} ${j.country ?? ""}`.slice(0, 58); } catch { return "n/a"; }
    }).catch(() => "n/a");
    console.log("  fingerprint:", JSON.stringify(fp));
    console.log("  egress:     ", ip);
    for (const [name, url] of GAUNTLET) {
      const r = await visit(page, url);
      console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${name.padEnd(11)} http ${String(r.status).padEnd(3)} ${String(r.ms).padStart(5)}ms  ${r.note || r.title}`);
    }
    await b.close();
  } catch (e) { console.log("  cdp error:", e.message.slice(0, 140)); }
  await h.stop();
}

const which = process.argv[2] ?? "all";
if (which === "all" || which === "solari") await run("Solari fast pool", makeSolari);
if (which === "all" || which === "bu") await run("browser-use, no proxy", () => makeBU());
if (which === "all" || which === "bu-proxy") await run("browser-use + US residential proxy", () => makeBU({ proxy: "us" }));
