// Captures /kleeto at desktop + mobile, full page and per-section, for the visual iteration pass.
import { chromium } from "playwright-core";
import fs from "node:fs";
const out = "landing/docs/design-references/";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [tag, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 160)));
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/full-${tag}.png`, fullPage: true });
  const sections = await page.$$eval("main > section, main > div > section, header, footer", (els) => els.map((e, i) => ({ i, id: e.id || e.tagName.toLowerCase(), top: e.getBoundingClientRect().top + window.scrollY, h: e.getBoundingClientRect().height })));
  for (const s of sections) {
    await page.evaluate((t) => window.scrollTo(0, Math.max(0, t - 40)), s.top);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${tag}-${String(s.i).padStart(2, "0")}-${s.id}.png` });
  }
  const h = await page.evaluate(() => document.body.scrollHeight);
  console.log(`${tag}: ${h}px, ${sections.length} sections, ${errors.length} console errors`);
  errors.slice(0, 10).forEach((e) => console.log("  !", e));
  await ctx.close();
}
await browser.close();
