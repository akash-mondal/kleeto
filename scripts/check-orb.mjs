/**
 * Does the logo change size over time?
 *
 * The shader iframe is sandboxed without same-origin, so its canvas cannot be read from the
 * page. Screenshotting the element and measuring the extent of drawn pixels answers the same
 * question from outside, which is also how a person would judge it.
 */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const URL = process.argv[2] ?? "http://127.0.0.1:3200/demo";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(7000);

const orb = await p.$("iframe[title], iframe");
const frames = await p.$$("iframe");
const small = [];
for (const f of frames) {
  const box = await f.boundingBox();
  if (box && box.width < 200) small.push(f);
}
if (!small.length) { console.log("no orb iframe found"); await b.close(); process.exit(1); }

const widths = [];
for (let i = 0; i < 12; i++) {
  const shot = await small[0].screenshot();
  writeFileSync("/tmp/orb.png", shot);
  const { execFileSync } = await import("node:child_process");
  const out = execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open("/tmp/orb.png").convert("L")
px = im.load(); w,h = im.size
xs = [x for y in range(h) for x in range(w) if px[x,y] > 60]
print(f"{max(xs)-min(xs)}" if xs else "0")
`], { encoding: "utf8" }).trim();
  widths.push(Number(out));
  await p.waitForTimeout(600);
}
const min = Math.min(...widths), max = Math.max(...widths);
console.log("drawn width over ~7s:", widths.join(", "));
console.log(`min ${min}  max ${max}  spread ${max - min}px (${(100*(max-min)/Math.max(max,1)).toFixed(1)}%)`);
console.log(max - min <= 4 ? "STEADY — no zoom" : "STILL BREATHING");
await b.close();
