import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.evaluate(async () => { for (let y = 0; y < 3000; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
const el = await p.locator("section").filter({ hasText: "Give it the machine" }).first();
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(6000);      // let the loops reach the work
await el.screenshot({ path: "/tmp/verify/trio.png" });
await b.close();
console.log("ok");
