// Ad-hoc capture of the sections under revision.
import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
});
await p.waitForTimeout(1200);
for (const [name, sel] of [["hero", "#top, header, section"], ["receipt", "#receipt"], ["footer", "footer"]]) {
  const el = await p.$(sel);
  if (!el) { console.log("missing", sel); continue; }
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  await el.screenshot({ path: `/tmp/fix-${name}.png` });
}
console.log("code panels left:", await p.$$eval("pre", els => els.length));
await b.close();
