// Does the page say both assets everywhere it names one, and do the marks resolve?
import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const bad = [];
p.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
await p.evaluate(async () => { for (const d of document.querySelectorAll("details, [aria-expanded]")) d.setAttribute("open", ""); });
const text = await p.evaluate(() => document.body.innerText);
const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => /USDC|HBAR/.test(s));
console.log("— every sentence naming an asset —");
for (const s of sentences) console.log("  •", s.replace(/\s+/g, " ").trim().slice(0, 150));
const lone = sentences.filter((s) => /USDC/.test(s) !== /HBAR/.test(s));
console.log("\nsentences naming only one asset:", lone.length ? lone.map(s => s.slice(0, 90)) : "none");
const marks = await p.$$eval("img[alt='HBAR'], img[alt='USDC'], img[alt='x402'], img[alt='Hedera']",
  els => els.map(e => `${e.alt}: ${e.naturalWidth}x${e.naturalHeight}`));
console.log("\nrail marks rendered:", marks.join("  |  ") || "none");
console.log("failed requests:", bad.length ? bad : "none");
await b.close();
