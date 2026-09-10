import { chromium } from "playwright-core";
const BU = process.env.BROWSER_USE_API_KEY;
const hdr = { "X-Browser-Use-API-Key": BU, "Content-Type": "application/json" };
// Is there a knob that drops the default residential proxy onto the $0.20/GB direct egress?
for (const [label, body] of [["proxyCountryCode:null", { timeout: 5, proxyCountryCode: null }], ["useProxy:false", { timeout: 5, useProxy: false }]]) {
  const r = await fetch("https://api.browser-use.com/api/v4/browsers", { method: "POST", headers: hdr, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.cdpUrl) { console.log(label, "->", r.status, JSON.stringify(j).slice(0, 110)); continue; }
  try {
    const b = await chromium.connectOverCDP(j.cdpUrl, { timeout: 40000 });
    const p = (b.contexts()[0] ?? await b.newContext()).pages()[0] ?? await (b.contexts()[0]).newPage();
    const ip = await p.evaluate(async () => { const j = await (await fetch("https://ipinfo.io/json")).json(); return `${j.ip} ${(j.org??"").slice(0,34)}`; }).catch(() => "n/a");
    const cf = await p.goto("https://nowsecure.nl/", { timeout: 40000, waitUntil: "domcontentloaded" }).then(async () => { await p.waitForTimeout(5000); return (await p.title()).slice(0, 30); }).catch(e => "ERR");
    console.log(`${label.padEnd(22)} egress ${ip.padEnd(46)} cloudflare: ${cf}`);
    await b.close();
  } catch (e) { console.log(label, "cdp:", e.message.slice(0, 70)); }
  await new Promise(r => setTimeout(r, 1500));
  const fin = await (await fetch(`https://api.browser-use.com/api/v4/browsers/${j.id}`, { method: "PATCH", headers: hdr, body: JSON.stringify({ action: "stop" }) })).json().catch(() => ({}));
  console.log(`   billed: browser $${(+fin.browserCost || 0).toFixed(4)}  proxy $${(+fin.proxyCost || 0).toFixed(4)}  ${(+fin.proxyUsedMb || 0).toFixed(1)}MB`);
}
