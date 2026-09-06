// Measure real animation behaviour: what elements look like at rest vs after entering view.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const KEY = process.env.SOLARI_API_KEY;
const PAGES = [
  ["solari-home", "https://www.getsolari.com"],
  ["runloop-home", "https://runloop.ai/"],
];

const s = await (await fetch("https://api.getsolari.com/sessions", {
  method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: "{}",
})).json();
const browser = await chromium.connectOverCDP(s.cdpEndpoint);
const ctx = browser.contexts()[0] ?? await browser.newContext();

for (const [name, url] of PAGES) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3500);

  // 1. at rest, before any scrolling: who is hidden/offset?
  const atRest = await page.evaluate(() => {
    const out = [];
    for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 6000)) {
      const c = getComputedStyle(el);
      const hidden = parseFloat(c.opacity) < 0.99;
      const moved = c.transform && c.transform !== "none";
      if (!hidden && !moved) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20) continue;
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.toString?.() || "").slice(0, 70),
        wId: el.getAttribute("data-w-id") || null,
        framer: el.getAttribute("data-framer-name") || null,
        opacity: c.opacity, transform: c.transform.slice(0, 60),
        transition: c.transition.slice(0, 90), animation: c.animation.slice(0, 70),
        belowFold: r.top > window.innerHeight,
      });
    }
    return out;
  });

  // 2. scroll everything into view, let it settle, re-measure the same nodes
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 160));
    }
  });
  await page.waitForTimeout(2000);
  const afterScroll = await page.evaluate(() => {
    let revealed = 0, still = 0;
    for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 6000)) {
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20) continue;
      if (parseFloat(c.opacity) > 0.99 && (c.transform === "none" || c.transform === "matrix(1, 0, 0, 1, 0, 0)")) revealed++;
      else still++;
    }
    return { revealed, still };
  });

  const hiddenBelowFold = atRest.filter(a => a.belowFold && parseFloat(a.opacity) < 0.99);
  const transitions = [...new Set(atRest.map(a => a.transition).filter(t => t && t !== "all"))];
  writeFileSync(`landing/reference/motion-${name}.json`,
    JSON.stringify({ atRestCount: atRest.length, hiddenBelowFold: hiddenBelowFold.length, afterScroll,
      samples: hiddenBelowFold.slice(0, 25), transitions: transitions.slice(0, 25) }, null, 1));
  console.log(`${name}: ${atRest.length} animated nodes, ${hiddenBelowFold.length} hidden below fold`);
  console.log("  transitions:", transitions.slice(0, 4));
  await page.close();
}
await browser.close();
await fetch(`https://api.getsolari.com/sessions/${s.sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${KEY}` } });
