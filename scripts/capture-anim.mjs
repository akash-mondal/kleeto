// Record frame sequences of animated regions so we can see what each component DOES.
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.SOLARI_API_KEY;
const TARGETS = [
  ["browsers", "https://www.getsolari.com/browsers"],
  ["sandboxes", "https://www.getsolari.com/sandboxes"],
  ["desktops", "https://www.getsolari.com/desktops"],
];

const s = await (await fetch("https://api.getsolari.com/sessions", {
  method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: "{}" })).json();
const browser = await chromium.connectOverCDP(s.cdpEndpoint);
const ctx = browser.contexts()[0] ?? await browser.newContext();

for (const [name, url] of TARGETS) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);

  // find section anchors by their heading text
  const sections = await page.evaluate(() => {
    const out = [];
    for (const h of document.querySelectorAll("h2, h3")) {
      const t = (h.textContent || "").trim();
      if (!t || t.length > 70) continue;
      // walk up to a sizeable container
      let el = h, best = h;
      for (let i = 0; i < 6 && el.parentElement; i++) {
        el = el.parentElement;
        const r = el.getBoundingClientRect();
        if (r.height > 260 && r.height < 1400) { best = el; break; }
      }
      const r = best.getBoundingClientRect();
      out.push({ text: t, top: r.top + window.scrollY, height: Math.round(r.height) });
    }
    return out;
  });

  mkdirSync(`landing/reference/motion/${name}`, { recursive: true });
  const picked = sections.filter(s => s.height > 260).slice(0, 8);
  const log = [];
  for (const [i, sec] of picked.entries()) {
    const slug = sec.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 34).replace(/-$/, "");
    await page.evaluate((y) => window.scrollTo({ top: y - 140, behavior: "instant" }), sec.top);
    await page.waitForTimeout(1800);   // let the reveal finish
    // 6 frames over 3s to see any looping/in-component animation
    for (let f = 0; f < 6; f++) {
      await page.screenshot({ path: `landing/reference/motion/${name}/${String(i).padStart(2,"0")}-${slug}-f${f}.png` });
      await page.waitForTimeout(500);
    }
    log.push({ i, text: sec.text, height: sec.height, slug });
  }
  writeFileSync(`landing/reference/motion/${name}/index.json`, JSON.stringify(log, null, 1));
  console.log(`${name}: ${picked.length} sections × 6 frames`);
  for (const l of log) console.log(`   ${l.i} ${l.text.slice(0,52)}`);
  await page.close();
}
await browser.close();
await fetch(`https://api.getsolari.com/sessions/${s.sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${KEY}` } });
