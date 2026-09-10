import { chromium } from "playwright-core";
const BASE = "https://api.getsolari.com"; const key = process.env.SOLARI_API_KEY;
const hdr = { Authorization: "Bearer " + key, "Content-Type": "application/json" };
async function probe(label, body) {
  const r = await fetch(BASE + "/sessions", { method: "POST", headers: hdr, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.sessionId) return console.log(label, "->", r.status, JSON.stringify(j).slice(0, 100));
  try {
    const b = await chromium.connectOverCDP(j.cdpEndpoint, { timeout: 30000 });
    const ctx = b.contexts()[0] ?? await b.newContext();
    const p = await ctx.newPage();
    const fp = await p.evaluate(() => ({ webdriver: navigator.webdriver, ua: navigator.userAgent.replace(/.*Chrome\//, "Chrome/").split(" ")[0], plugins: navigator.plugins.length, langs: navigator.languages.join(","), hc: navigator.hardwareConcurrency }));
    await p.goto("https://arh.antoinevastel.com/bots/areyouheadless", { timeout: 30000, waitUntil: "domcontentloaded" }).catch(() => {});
    const verdict = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 80)).catch(() => "n/a");
    const ip = await p.evaluate(async () => (await (await fetch("https://api.ipify.org")).text()).slice(0, 40)).catch(() => "n/a");
    console.log(label.padEnd(18), JSON.stringify(fp), "| ip", ip, "|", verdict);
    await b.close();
  } catch (e) { console.log(label, "cdp failed:", e.message.slice(0, 100)); }
  await fetch(BASE + "/sessions/" + j.sessionId, { method: "DELETE", headers: hdr });
}
await probe("fast {}", {});
await probe("mode:stealth", { mode: "stealth" });
await probe("pool:stealth", { pool: "stealth" });
