import { chromium } from "playwright-core";
const BU = process.env.BROWSER_USE_API_KEY;
const hdr = { "X-Browser-Use-API-Key": BU, "Content-Type": "application/json" };
const r = await fetch("https://api.browser-use.com/api/v2/browsers", { method: "POST", headers: hdr, body: JSON.stringify({ timeout: 10 }) });
const j = await r.json();
const b = await chromium.connectOverCDP(j.cdpUrl, { timeout: 45000 });
const ctx = b.contexts()[0] ?? await b.newContext();
const p = ctx.pages()[0] ?? await ctx.newPage();
for (const url of ["https://nowsecure.nl/", "https://www.scrapingcourse.com/cloudflare-challenge", "https://www.walmart.com/", "https://www.zillow.com/"]) {
  try {
    const resp = await p.goto(url, { timeout: 45000, waitUntil: "domcontentloaded" });
    await p.waitForTimeout(6000);
    const info = await p.evaluate(() => ({ t: document.title.slice(0,50), len: document.body?.innerText?.length ?? 0, snip: document.body?.innerText?.replace(/\s+/g," ").slice(0,110) }));
    console.log(`${resp?.status()}  len=${String(info.len).padStart(6)}  ${url.replace(/https:\/\//,'').slice(0,42).padEnd(43)} | ${info.t} | ${info.snip}`);
  } catch (e) { console.log("ERR", url, e.message.slice(0,60)); }
}
await b.close();
await fetch(`https://api.browser-use.com/api/v2/browsers/${j.id}`, { method: "PATCH", headers: hdr, body: JSON.stringify({ action: "stop" }) }).catch(()=>{});
