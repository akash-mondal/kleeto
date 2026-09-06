import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.evaluate(async () => { for (let y = 0; y < 4000; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
const el = p.locator("section#lanes").first();
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(2500);
await el.screenshot({ path: "/tmp/lanes.png" });
// measure where each interior row starts, to confirm they line up
const rows = await p.evaluate(() => {
  const cards = [...document.querySelectorAll("#lanes h3")].map((h) => {
    const card = h.closest("div.flex");
    const q = (sel, i) => card.querySelectorAll(sel)[i]?.getBoundingClientRect().top;
    return { headline: Math.round(h.getBoundingClientRect().top),
             body: Math.round(card.querySelectorAll("p")[1].getBoundingClientRect().top),
             spec: Math.round(card.querySelectorAll("p")[2].getBoundingClientRect().top),
             footer: Math.round(card.querySelector("div.mt-auto").getBoundingClientRect().top) };
  });
  return cards;
});
console.log(JSON.stringify(rows, null, 1));
await b.close();
