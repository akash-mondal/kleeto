/**
 * Renders the ThreeUI data-pixel arc to a background plate for the film.
 *
 * The renderer advances its own `time` by a fixed step inside render(), so stepping it
 * once per output frame gives a frame-exact, repeatable plate — which is what the video
 * pipeline needs, since HyperFrames seeks rather than plays.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";

const FPS = 24, SECONDS = 24.5;
const FRAMES = Math.round(FPS * SECONDS);
const DIR = "/tmp/plate/frames";
mkdirSync(DIR, { recursive: true });

// ES modules are blocked over file://, so the page is served for the capture.
const server = spawn("python3", ["-m", "http.server", "8781", "--bind", "127.0.0.1"],
  { cwd: "/tmp/plate", stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:8781/index.html", { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });

for (let f = 0; f < FRAMES; f++) {
  if (f) await page.evaluate(() => window.__step(1));
  const buf = await page.screenshot({ type: "png" });
  writeFileSync(`${DIR}/f${String(f).padStart(4, "0")}.png`, buf);
  if (f % 60 === 0) console.log(`  frame ${f}/${FRAMES}`);
}
await browser.close();
server.kill();

execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", `${DIR}/f%04d.png`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
  "videos/kleeto-hero-film/assets/plate.mp4"]);
console.log("plate written:", FRAMES, "frames at", FPS, "fps");
