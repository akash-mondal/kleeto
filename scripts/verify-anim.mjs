// Does our clone actually animate? Same method used on the real site: frames + pixel diff.
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
mkdirSync("landing/reference/verify", { recursive: true });

for (const [name, path, scrollY] of [
  ["sandboxes-aurora", "/sandboxes", 1500],
  ["browsers-carousel", "/browsers", 2600],
  ["sandboxes-terminal", "/sandboxes", 3000],
]) {
  const page = await ctx.newPage();
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scrollY);
  await page.waitForTimeout(2200);
  const shots = [];
  for (let f = 0; f < 5; f++) {
    const p = `landing/reference/verify/${name}-f${f}.png`;
    await page.screenshot({ path: p });
    shots.push(p);
    await page.waitForTimeout(600);
  }
  const a = await sharp(shots[0]).raw().toBuffer({ resolveWithObject: true });
  let best = 0;
  for (const s of shots.slice(1)) {
    const b = await sharp(s).raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = a.info;
    let cnt = 0;
    for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * channels;
      if (Math.abs(a.data[i]-b.data[i]) + Math.abs(a.data[i+1]-b.data[i+1]) + Math.abs(a.data[i+2]-b.data[i+2]) > 28) cnt++;
    }
    best = Math.max(best, cnt);
  }
  const pct = (best / ((a.info.width/2)*(a.info.height/2)) * 100).toFixed(2);
  console.log(`  ${name.padEnd(20)} ${String(pct).padStart(6)}% of viewport changing`);
  await page.close();
}
await browser.close();
