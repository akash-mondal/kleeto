// Legibility check for the mark: renders it small and measures where the ink lands, so a
// mark that mushes into a blob at favicon size fails here instead of in someone's tab bar.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

/** Decodes a PNG through sips + a raw dump, to avoid pulling in an image dependency. */
async function decode(buf) {
  fs.writeFileSync("/tmp/mark-in.png", buf);
  execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open("/tmp/mark-in.png").convert("RGB")
open("/tmp/mark-in.raw", "wb").write(im.tobytes())
open("/tmp/mark-in.dim", "w").write(f"{im.width} {im.height}")
`]);
  const [width, height] = fs.readFileSync("/tmp/mark-in.dim", "utf8").split(" ").map(Number);
  const rgb = fs.readFileSync("/tmp/mark-in.raw");
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgb[i * 3]; data[i * 4 + 1] = rgb[i * 3 + 1];
    data[i * 4 + 2] = rgb[i * 3 + 2]; data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 200, height: 200 } });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
const svg = await p.$eval("header svg, nav svg", el => el.outerHTML);
for (const size of [16, 32, 128]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<body style="margin:0;background:#fff;color:#211d19">
    <span style="display:block;width:${size}px;height:${size}px">${svg}</span></body>`);
  await p.evaluate(() => { const s = document.querySelector("svg"); s.style.width = "100%"; s.style.height = "100%"; });
  const buf = await p.screenshot();
  fs.writeFileSync(`/tmp/mark-${size}.png`, buf);
  const png = await decode(buf);
  let ring = 0, gap = 0, core = 0, amber = 0;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4;
    const [r, g, bl] = [png.data[i], png.data[i + 1], png.data[i + 2]];
    const ink = 255 - (r + g + bl) / 3 > 26;
    if (!ink) continue;
    if (r - bl > 60 && g - bl > 30) amber++;
    const d = Math.hypot(x + 0.5 - png.width / 2, y + 0.5 - png.height / 2) / (png.width / 2);
    if (d > 0.70) ring++; else if (d > 0.46) gap++; else core++;
  }
  console.log(`${String(size).padStart(3)}px  ring=${ring}  gapband=${gap}  core=${core}  amber=${amber}`);
}
await b.close();
