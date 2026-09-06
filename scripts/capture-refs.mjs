// Capture the reference sites using our own browser lane.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const KEY = process.env.SOLARI_API_KEY;
const URLS = [
  ["solari-home",      "https://www.getsolari.com"],
  ["solari-browsers",  "https://www.getsolari.com/browsers"],
  ["solari-sandboxes", "https://www.getsolari.com/sandboxes"],
  ["solari-desktops",  "https://www.getsolari.com/desktops"],
  ["runloop-home",     "https://runloop.ai/"],
];

const r = await fetch("https://api.getsolari.com/sessions", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const session = await r.json();
if (!session.cdpEndpoint) throw new Error("no session: " + JSON.stringify(session).slice(0, 200));
console.log("browser lane up:", session.sessionId.slice(0, 28) + "…");

const browser = await chromium.connectOverCDP(session.cdpEndpoint);
const ctx = browser.contexts()[0] ?? await browser.newContext();

for (const [name, url] of URLS) {
  const page = await ctx.newPage();
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500);
    // settle lazy content
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    writeFileSync(`landing/reference/html/${name}.html`, await page.content());
    await page.screenshot({ path: `landing/reference/shots/${name}-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `landing/reference/shots/${name}-mobile.png`, fullPage: true });

    // design tokens actually in use
    const tokens = await page.evaluate(() => {
      const seen = { colors: {}, bg: {}, fonts: {}, sizes: {}, radii: {} };
      const bump = (o, k) => { if (k) o[k] = (o[k] || 0) + 1; };
      for (const el of Array.from(document.querySelectorAll("*")).slice(0, 4000)) {
        const s = getComputedStyle(el);
        bump(seen.colors, s.color);
        if (s.backgroundColor !== "rgba(0, 0, 0, 0)") bump(seen.bg, s.backgroundColor);
        bump(seen.fonts, s.fontFamily);
        if (el.textContent?.trim()) bump(seen.sizes, `${s.fontSize}/${s.fontWeight}`);
        if (s.borderRadius !== "0px") bump(seen.radii, s.borderRadius);
      }
      const top = (o, n = 14) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
      return {
        colors: top(seen.colors), backgrounds: top(seen.bg), fonts: top(seen.fonts, 6),
        typeScale: top(seen.sizes, 18), radii: top(seen.radii, 8),
        title: document.title,
        h1: [...document.querySelectorAll("h1")].map(e => e.textContent.trim()).slice(0, 4),
        h2: [...document.querySelectorAll("h2")].map(e => e.textContent.trim()).slice(0, 14),
        ctas: [...document.querySelectorAll("a,button")].map(e => e.textContent.trim())
          .filter(t => t && t.length < 40).slice(0, 22),
        sections: document.body.scrollHeight,
      };
    });
    writeFileSync(`landing/reference/styles/${name}.json`, JSON.stringify(tokens, null, 2));
    console.log(`  ✓ ${name.padEnd(18)} ${tokens.sections}px  "${tokens.title.slice(0, 46)}"`);
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message.slice(0, 90)}`);
  } finally { await page.close(); }
}
await browser.close();
await fetch(`https://api.getsolari.com/sessions/${session.sessionId}`, {
  method: "DELETE", headers: { Authorization: `Bearer ${KEY}` },
});
console.log("lane released");
