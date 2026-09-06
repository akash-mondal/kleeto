// Proof sheet: the mark at favicon, nav, and display sizes, on paper and on a dark card.
import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 420 }, deviceScaleFactor: 3 });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
const svg = await p.$eval("header svg, nav svg", el => el.outerHTML);
await p.setContent(`<html class="kleeto"><head>
<link rel="stylesheet" href="http://127.0.0.1:3200/_next/static/css/${(await p.evaluate(() => [...document.styleSheets].map(s => s.href).filter(Boolean).map(h => h.split('/').pop())))[0]}">
</head><body style="margin:0;font-family:sans-serif">
<div style="display:flex;gap:34px;align-items:flex-end;padding:34px;background:oklch(0.975 0.006 85);color:oklch(0.21 0.012 85)">
 ${[16, 22, 32, 64, 128].map(s => `<span style="width:${s}px;height:${s}px;display:block">${svg}</span>`).join("")}
</div>
<div style="display:flex;gap:34px;align-items:flex-end;padding:34px;background:oklch(0.14 0.01 85);color:oklch(0.96 0.006 85)">
 ${[16, 22, 32, 64, 128].map(s => `<span style="width:${s}px;height:${s}px;display:block">${svg}</span>`).join("")}
</div></body></html>`);
await p.evaluate(() => document.querySelectorAll("svg").forEach(s => { s.style.width = "100%"; s.style.height = "100%"; }));
await p.waitForTimeout(400);
await p.screenshot({ path: "/tmp/logo-proof.png", fullPage: true });
await b.close();
