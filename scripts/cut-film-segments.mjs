/** Cuts the film's ten shots out of the three takes, each already timed to its slot. */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const A = "agent-runs/film/raw.mp4";           // the 188s continuous take
const B = "agent-runs/film/preview.mp4";       // the re-shot preview beat
const C = "agent-runs/lane-clips/desktop.mp4"; // Blender in the GUI (the film take lost it behind a fullscreen terminal)
const OUT = "videos/kleeto-hero-film/assets";
mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { id: "s1-browser",  src: A, in: 3.5,  out: 11.5, dur: 5.0 },
  { id: "s2-collect",  src: A, in: 21,   out: 30,   dur: 6.0 },
  { id: "s3-plot",     src: A, in: 31,   out: 38.5, dur: 4.0 },
  { id: "s4-render",   src: A, in: 40,   out: 54,   dur: 6.0 },
  { id: "s5-serve",    src: B, in: 1,    out: 13,   dur: 4.5 },
  { id: "s6-public",   src: B, in: 25,   out: 34,   dur: 5.0 },
  { id: "s7-blender",  src: C, in: 3,    out: 16,   dur: 6.0 },
  { id: "s8-result",   src: C, in: 29,   out: 33.3, dur: 4.0 },
  { id: "s9-calc",     src: A, in: 156,  out: 168,  dur: 5.0 },
  { id: "s10-receipt", src: A, in: 182,  out: 188,  dur: 5.5,
    crop: "crop=1280:290:0:415,pad=1280:720:0:215:0x171310" },
];

let t = 0;
for (const s of SHOTS) {
  const rate = (s.out - s.in) / s.dur;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(s.in), "-to", String(s.out), "-i", s.src,
    "-filter:v", `setpts=PTS/${rate.toFixed(4)},fps=24,${s.crop ?? "scale=1280:720"}`,
    "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", `${OUT}/${s.id}.mp4`]);
  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${OUT}/${s.id}.mp4`]).toString().trim();
  console.log(`${s.id.padEnd(12)} ${s.in}->${s.out} at ${rate.toFixed(2)}x  =>  ${Number(dur).toFixed(2)}s   (timeline ${t.toFixed(1)}s)`);
  t += s.dur;
}
console.log("total footage", t.toFixed(1), "s");
