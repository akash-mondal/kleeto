import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
const marks = await p.$$eval("img[alt='HBAR'], img[alt='USDC'], img[alt='x402'], img[alt='Hedera']", els =>
  els.map(e => { const r = e.getBoundingClientRect(); const s = e.closest("section")?.id ?? "?";
    return `${s}/${e.alt} ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)}`; }));
console.log(marks.join("\n"));
await b.close();
