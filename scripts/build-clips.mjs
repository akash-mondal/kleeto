/**
 * Turns the raw lane takes into the three product-card loops.
 *
 * Each loop is exactly ten seconds: three seconds of the prompt streaming in the way an
 * agent receives it, then seven seconds cut straight to the middle of the work. Loading,
 * waiting and empty render buffers are cut out — only the parts where something is
 * visibly happening survive.
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

const IN = "agent-runs/lane-clips";
const OUT = "landing/public/video";
const TMP = "/tmp/kleeto-clips";
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const GROUND = "#171310";                 // matches oklch(0.14 0.01 85), the card ground
const TYPE_S = 3.2;                       // prompt card, including the hold at the end
const WORK_S = 7.1;                       // action, after the cross-fade eats 0.3s
const FADE = 0.3;
const FPS = 24;

const CLIPS = [
  {
    name: "browser",
    lane: "browser-fast",
    // The httpbin form was a real job but it looked like a 1997 test page. This is the
    // shape TinyFish describes in its own case studies — a price and stock check on a
    // live storefront — on a shop that is actually pleasant to look at.
    prompt: "Check the price and stock on the store's featured item.",
    src: "agent-runs/web/raw.mp4",
    segments: [[56.0, 74.0]],
  },
  {
    name: "desktop",
    lane: "desktop-4",
    prompt: "Open the scene in Blender, frame the camera and render it.",
    // Orbit and frame, then jump the fourteen dead seconds of empty render buffer and
    // land on the finished image.
    segments: [[6.5, 16], [29.4, 33.3]],
  },
  {
    name: "machine",
    lane: "machine-4",
    // A wall of scrolling render log reads as nothing at card size. btop shows the same
    // truth — four cores pinned by a real job — as graphs and meters.
    prompt: "Hash a stream on every core, and show me the load.",
    src: "agent-runs/lane-clips-2/machine.mp4",
    segments: [[1.5, 15.0]],
  },
];

const html = (lane) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500&family=Azeret+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;height:100%}
  body{background:${GROUND};display:flex;align-items:center;justify-content:center;
       font-family:Archivo,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{width:76%;text-align:center}
  .label{font-family:"Azeret Mono",monospace;font-size:17px;letter-spacing:0.22em;text-transform:uppercase;
         color:oklch(0.8 0.165 85);margin-bottom:34px}
  .prompt{font-size:46px;line-height:1.26;font-weight:500;letter-spacing:-0.02em;color:oklch(0.96 0.006 85);
          min-height:2.52em}
  .caret{display:inline-block;width:3px;height:0.9em;background:oklch(0.8 0.165 85);
         margin-left:8px;transform:translateY(0.1em)}
  .caret.off{opacity:0}
  .lane{font-family:"Azeret Mono",monospace;font-size:15px;color:oklch(0.7 0.012 85);margin-top:38px}
</style></head><body>
  <div class="wrap">
    <div class="label">Prompt</div>
    <div class="prompt"><span id="t"></span><span class="caret" id="c"></span></div>
    <div class="lane">${lane}</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

for (const c of CLIPS) {
  const dir = `${TMP}/${c.name}`;
  mkdirSync(dir, { recursive: true });
  await page.setContent(html(c.lane), { waitUntil: "load" });
  await page.waitForTimeout(1200);                       // let the webfonts land

  // Frame-by-frame typing. The text finishes with roughly a second to spare so the
  // finished prompt is readable before the cut.
  const frames = Math.round(TYPE_S * FPS);
  const typeFrames = Math.round(frames * 0.68);
  for (let i = 0; i < frames; i++) {
    const p = Math.min(1, i / typeFrames);
    const shown = Math.round(c.prompt.length * (1 - Math.pow(1 - p, 1.7)));   // ease out
    await page.evaluate(([text, blink]) => {
      document.getElementById("t").textContent = text;
      document.getElementById("c").classList.toggle("off", blink);
    }, [c.prompt.slice(0, shown), p >= 1 && Math.floor(i / 8) % 2 === 1]);
    await page.screenshot({ path: `${dir}/f${String(i).padStart(3, "0")}.png` });
  }
  // The poster is the completed prompt, so a paused card still states the task.
  await page.evaluate((text) => { document.getElementById("t").textContent = text; }, c.prompt);
  await page.screenshot({ path: `${dir}/poster.png` });

  const title = `${dir}/title.mp4`;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", `${dir}/f%03d.png`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", title]);

  // Concatenate only the live segments, then fit them to exactly WORK_S.
  const rawTotal = c.segments.reduce((t, [a, b]) => t + (b - a), 0);
  const speed = rawTotal / WORK_S;
  const parts = c.segments.map((_, i) => `[0:v]trim=start=${c.segments[i][0]}:end=${c.segments[i][1]},setpts=PTS-STARTPTS[s${i}]`).join(";");
  const concat = c.segments.map((_, i) => `[s${i}]`).join("") + `concat=n=${c.segments.length}:v=1:a=0[j]`;
  const work = `${dir}/work.mp4`;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", c.src ?? `${IN}/${c.name}.mp4`,
    "-filter_complex", `${parts};${concat};[j]setpts=PTS/${speed.toFixed(4)},fps=${FPS},scale=1280:720[v]`,
    "-map", "[v]", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", work]);

  // Cross-fade the card into the work, and fade the tail back to the card's ground so
  // the loop turns over cleanly.
  const joined = `${dir}/joined.mp4`;
  const total = TYPE_S + WORK_S - FADE;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", title, "-i", work,
    "-filter_complex",
    `[0:v]format=yuv420p,fps=${FPS}[a];[1:v]format=yuv420p,fps=${FPS},scale=1280:720[b];` +
    `[a][b]xfade=transition=fade:duration=${FADE}:offset=${TYPE_S - FADE}[x];` +
    `[x]fade=t=out:st=${(total - 0.45).toFixed(2)}:d=0.45:color=${GROUND}[v]`,
    "-map", "[v]", "-an", joined]);

  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", joined, "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-crf", "30", "-preset", "veryslow", "-tune", "stillimage", "-movflags", "+faststart", "-an", `${OUT}/lane-${c.name}.mp4`]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", joined, "-c:v", "libvpx-vp9", "-crf", "37", "-b:v", "0",
    "-row-mt", "1", "-deadline", "good", "-cpu-used", "3", "-an", `${OUT}/lane-${c.name}.webm`]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${dir}/poster.png`, "-q:v", "6", `${OUT}/lane-${c.name}-poster.jpg`]);

  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${OUT}/lane-${c.name}.mp4`]).toString().trim();
  console.log(`${c.name.padEnd(8)} ${Number(dur).toFixed(2)}s   work ${rawTotal.toFixed(1)}s raw at ${speed.toFixed(2)}x`);
}
await browser.close();
