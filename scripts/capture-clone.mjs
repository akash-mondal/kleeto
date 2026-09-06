import { chromium } from "playwright-core";
const KEY = process.env.SOLARI_API_KEY;
const ROUTES = [["home","/"],["browsers","/browsers"],["sandboxes","/sandboxes"],["desktops","/desktops"],["runloop","/runloop"]];
// local server, so drive a local chromium via CDP is not available — use the lane only for
// remote sites. For localhost we need a local browser; fall back to screenshotting via the lane
// is impossible. Use playwright's bundled chromium if present, else report sizes only.
let browser;
try { browser = await chromium.launch(); } catch (e) {
  console.log("no local chromium:", e.message.slice(0,80));
  for (const [name, path] of ROUTES) {
    const r = await fetch(`http://localhost:3000${path}`);
    const html = await r.text();
    console.log(`  ${name.padEnd(10)} ${r.status}  ${html.length.toLocaleString()} bytes html`);
  }
  process.exit(0);
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const [name, path] of ROUTES) {
  const page = await ctx.newPage();
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));} window.scrollTo(0,0); });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `landing/docs/design-references/CLONE-${name}-desktop.png`, fullPage: true });
  const h = await page.evaluate(() => document.body.scrollHeight);
  console.log(`  ${name.padEnd(10)} ${h}px`);
  await page.close();
}
await browser.close();
