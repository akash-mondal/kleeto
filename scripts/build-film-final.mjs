/**
 * Builds the finished hero film: an opening that shows how a lease actually starts,
 * then thirty seconds of an agent working, one second per application.
 *
 * Under every shot sits the exchange that produced it — the prompt the agent was given
 * and what it is doing about it — so the montage reads as instructions being carried out
 * rather than a person clicking around.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const OUT = "videos/kleeto-hero-film/assets/final";
mkdirSync(OUT, { recursive: true });

const RATE = 2.0;   // twice speed
const SHOT = 1.0;   // one second per application on the timeline
const FLIP = 0.3;   // THINKING -> ACTING
const LEAD = 1.75;  // how far before the "acting" beat the source window starts

const TAKES = {
  gui: "agent-runs/gui/raw.mp4",
  guib: "agent-runs/gui-b/raw.mp4",
  cx: "agent-runs/complex/raw.mp4",
  b: "agent-runs/thirty-b/raw.mp4",
  web: "agent-runs/web/raw.mp4",
};
const BEATS = Object.fromEntries(Object.entries({
  gui: "agent-runs/gui/beats.json",
  guib: "agent-runs/gui-b/beats.json",
  cx: "agent-runs/complex/beats.json",
  b: "agent-runs/thirty-b/beats.json",
  web: "agent-runs/web/beats.json",
}).map(([k, v]) => [k, existsSync(v) ? JSON.parse(readFileSync(v, "utf8")) : []]));
const CURSORS = Object.fromEntries(Object.entries({
  gui: "agent-runs/gui/cursor.json",
  guib: "agent-runs/gui-b/cursor.json",
  cx: "agent-runs/complex/cursor.json",
  b: "",
  web: "agent-runs/web/cursor.json",
}).map(([k, v]) => [k, v && existsSync(v) ? JSON.parse(readFileSync(v, "utf8")) : []]));

/** app, take, and the exchange shown under the shot. */
const SHOTS = [
  // --- the complex re-shoots: every one has a visible result
  ["Chrome",            "web",  "Storefront",        "Check the price and stock on the store's featured item.", "reading the product options"],
  ["Chrome",            "web",  "Grafana",           "Check the service dashboard for the last hour.", "reading the live panels"],
  ["Chrome",            "web",  "GitHub",            "Open the newest pull request and show me the diff.", "reading the changed files"],
  ["Chrome",            "web",  "OpenStreetMap",     "Plan a driving route from the Louvre to Gare du Nord.", "reading the turn-by-turn directions"],
  ["GIMP",              "cx",   "GIMP",              "Open the render and set up an edge-detect.", "working the filter menu"],
  ["System Monitor",    "cx",   "System Monitor",    "Show me the resource graphs while that runs.", "reading CPU and memory"],
  ["Baobab",            "cx",   "Baobab",            "What is filling the disk on this machine?", "scanning the filesystem"],
  ["PDF Arranger",      "cx",   "PDF Arranger",      "Rotate the page and save the file.", "turning the page"],
  ["Dia",               "cx",   "Dia",               "Sketch the flow: agent, lease, receipt.", "placing the shapes"],
  ["DB Browser",        "cx",   "DB Browser",        "Which lease cost the most across this run?", "opening the database"],
  ["LibreOffice Calc",  "cx",   "LibreOffice Calc",  "Chart the quarterly sales by region.", "selecting the block to chart"],
  // --- the best of the earlier GUI take
  ["Blender",           "gui",  "Blender",           "Frame the camera on the scene and render it.", "orbiting the viewport"],
  ["Epiphany",          "guib", "Epiphany",          "Open the same page in a second browser engine.", "loading the front page"],
  ["Thunar",            "gui",  "Thunar",            "Show me everything this lease produced.", "listing the outputs"],
  ["File Roller",       "gui",  "File Roller",       "What is inside the archive?", "reading the entries"],
  ["Xarchiver",         "gui",  "Xarchiver",         "Check the compression on those files.", "comparing sizes"],
  ["Evince",            "gui",  "Evince",            "Open the PDF it produced.", "paging through it"],
  ["Eye of GNOME",      "gui",  "Eye of GNOME",      "Show the render at full size.", "reading the image properties"],
  ["gThumb",            "gui",  "gThumb",            "Browse the output folder as thumbnails.", "walking the folder"],
  ["Gnumeric",          "gui",  "Gnumeric",          "Load the CSV into a second spreadsheet.", "importing the columns"],
  ["Geany",             "gui",  "Geany",             "Open the hashing script.", "reading the source"],
  ["Meld",              "guib", "Meld",              "Diff the report against my notes.", "highlighting the changes"],
  ["Task Manager",      "gui",  "Task Manager",      "What is running on this machine?", "sorting by CPU"],
  ["Disks",             "gui",  "Disks",             "Show me the block device.", "reading the volume"],
  ["Calculator",        "gui",  "Calculator",        "Work out the cost of ten minutes.", "entering the figures"],
  ["Inkscape",          "gui",  "Inkscape",          "Draw over the artwork with the star tool.", "dragging out the shape"],
  ["Color Picker",      "gui",  "Color Picker",      "Pick the brand amber and give me the hex.", "reading the wheel"],
  ["Ristretto",         "b",    "Ristretto",         "Open the render in the image viewer.", "displaying the frame"],
  ["LibreOffice Draw",  "gui",  "LibreOffice Draw",  "Draw the panel for the diagram.", "dragging out the rectangle"],
  ["Mousepad",          "gui",  "Mousepad",          "Note what the run produced.", "appending a line"],
  ["Galculator",        "gui",  "Galculator",        "Check the per-second rate.", "clicking through it"],
];

/**
 * Where the work is in a shot that logged no pointer.
 *
 * Eleven of the thirty takes predate the pointer logging, and parking their cursor on a
 * fixed coordinate put it in dead grey chrome. This reads the clip's middle frame and
 * returns the centre of its busiest cell, which is where the application's content is, so
 * the pointer at least lands on the part of the screen the shot is about.
 */
function interestPoint(file) {
  const png = "/tmp/kleeto-interest.png";
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "0.5", "-i", file, "-frames:v", "1", png]);
  const out = execFileSync("python3", ["-c", `
from PIL import Image, ImageFilter
im = Image.open("${png}").convert("L").filter(ImageFilter.FIND_EDGES).resize((32, 18))
px = im.load()
best, bx, by = -1, 16, 9
for cy in range(2, 16):
    for cx in range(3, 29):
        v = sum(px[cx+dx, cy+dy] for dx in (-2,-1,0,1,2) for dy in (-1,0,1))
        if v > best: best, bx, by = v, cx, cy
print(int((bx + 0.5) * 40), int((by + 0.5) * 40))
`]).toString().trim().split(" ").map(Number);
  return { x: out[0], y: out[1] };
}

const shots = [];
for (const [label, take, key, prompt, doing] of SHOTS) {
  if (shots.length >= 30) break;
  const beats = BEATS[take];
  const idx = beats.findIndex((b) => b.app === key && (b.phase === "acting" || !b.phase));
  if (idx < 0) { console.log(`-- ${label}: no "acting" beat in take ${take}`); continue; }
  const act = beats[idx];
  const think = [...beats].reverse().find((b) => b.app === key && b.phase === "thinking" && b.at < act.at);
  // Beats without a phase mark the moment the shot is worth watching, so back up a beat.
  const start = Math.max(0.1, Math.min(act.at - LEAD, (think?.at ?? act.at - LEAD) + 0.2));
  const id = String(shots.length + 1).padStart(2, "0");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(start), "-t", String(SHOT * RATE), "-i", TAKES[take],
    "-filter:v", `setpts=PTS/${RATE},fps=24,scale=1280:720`, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-g", "1", "-crf", "20", `${OUT}/${id}.mp4`]);
  const marks = CURSORS[take]
    .filter((c) => c.t >= start - 0.3 && c.t <= start + SHOT * RATE + 0.3)
    .map((c) => ({ t: +Math.min(Math.max((c.t - start) / RATE, 0), SHOT - 0.05).toFixed(2), x: c.x, y: c.y }));
  const focus = marks.length ? null : interestPoint(`${OUT}/${id}.mp4`);
  shots.push({ id, label, prompt, doing, cursor: marks, focus });
  console.log(`${id} ${label.padEnd(20)} ${take.padEnd(5)} @ ${start.toFixed(1)}s  ${marks.length} pointer marks`);
}
console.log(`\n${shots.length} shots`);
writeFileSync(`${OUT}/shots.json`, JSON.stringify(shots, null, 1));

/* ==================================================================== composition ==== */
const OPEN_END = 23.2;                       // the opening sequence, then the montage
const total = OPEN_END + shots.length * SHOT;

const videos = shots.map((s, i) =>
  `      <video id="v${i + 1}" class="shot-video" src="assets/final/${s.id}.mp4" ` +
  `data-start="${(OPEN_END + i * SHOT).toFixed(2)}" data-duration="${SHOT.toFixed(2)}" ` +
  `data-track-index="${1 + (i % 2)}" muted playsinline></video>`).join("\n");

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const overlays = shots.map((s, i) => {
  const start = OPEN_END + i * SHOT;
  return `      <div id="ov${i + 1}" class="clip overlay" data-start="${start.toFixed(2)}" data-duration="${SHOT.toFixed(2)}" data-track-index="4">
        <div class="frame"></div>
        <div class="chat">
          <div class="ask"><span class="tag">prompt</span><span class="msg">${esc(s.prompt)}</span></div>
          <div class="did">
            <span class="state"><span class="pip"></span><span class="stack"><span class="txt think" id="th${i + 1}">THINKING</span><span class="txt act" id="ac${i + 1}">ACTING</span></span></span>
            <span class="app">${esc(s.label)}</span><span class="what">${esc(s.doing)}</span>
          </div>
        </div>
        <div class="count">${String(i + 1).padStart(2, "0")}<span class="of">/${shots.length}</span></div>
        <span class="agent-cursor" id="cur${i + 1}"><svg viewBox="0 0 12 18" width="12" height="18"><path d="M1 1 L1 15 L4.5 11.6 L7 17 L9.4 15.9 L6.9 10.8 L11 10.6 Z" fill="#171310" stroke="#f5b301" stroke-width="1.2"/></svg><b>agent</b></span>
      </div>`;
}).join("\n");

const timelines = shots.map((s, i) => {
  const start = OPEN_END + i * SHOT;
  // A pointer does not jump between waypoints in straight lines. The logged coordinates
  // are the truth of where the agent went; between them the path is smoothed into a
  // curve, and it is walked with one eased tween per shot so the motion accelerates away
  // from a point and settles into the next — the way a hand does.
  // Every shot used to open with the pointer 96px left and 62px above its first waypoint,
  // so all thirty slid down and to the right and the montage read as one long drift. The
  // approach angle now steps by the golden angle, which spreads consecutive shots right
  // around the circle and never repeats a direction; the settle after the last waypoint
  // turns away from the approach, so the pointer arcs through the work instead of sliding
  // past it. Deterministic, from the shot index alone.
  const anchors = s.cursor.length ? s.cursor : [s.focus ?? { x: 640, y: 380 }];
  const inAngle = ((i * 137.508) % 360) * Math.PI / 180;
  const outAngle = inAngle + Math.PI * (0.55 + ((i % 3) * 0.15));
  const reach = 168 + ((i * 37) % 74);
  const settle = 74 + ((i * 53) % 46);
  const inside = (x, y) => ({ x: Math.min(Math.max(x, 74), 1206), y: Math.min(Math.max(y, 74), 646) });
  const head = anchors[0];
  const tail = anchors[anchors.length - 1];
  const path = [
    inside(head.x + Math.cos(inAngle) * reach, head.y + Math.sin(inAngle) * reach),
    ...anchors.map((p) => inside(p.x, p.y)),
    inside(tail.x + Math.cos(outAngle) * settle, tail.y + Math.sin(outAngle) * settle),
  ];
  const json = JSON.stringify(path.map((p) => [p.x, p.y]));
  return `      tl.set("#cur${i + 1}", { x: ${path[0].x}, y: ${path[0].y} }, ${start.toFixed(2)});
      tl.from("#ov${i + 1} .chat", { opacity: 0, y: 8, duration: 0.22, ease: "power3.out" }, ${start.toFixed(2)});
      tl.from("#ov${i + 1} .count", { opacity: 0, duration: 0.22 }, ${start.toFixed(2)});
      tl.to(walk(${i + 1}, ${json}), { p: 1, duration: ${(SHOT - 0.06).toFixed(2)}, ease: "power1.inOut", onUpdate: walkUpdate }, ${start.toFixed(2)});
      tl.set("#th${i + 1}", { opacity: 1 }, ${start.toFixed(2)});
      tl.set("#ac${i + 1}", { opacity: 0 }, ${start.toFixed(2)});
      tl.to("#th${i + 1}", { opacity: 0, duration: 0.12, ease: "none" }, ${(start + FLIP).toFixed(2)});
      tl.to("#ac${i + 1}", { opacity: 1, duration: 0.12, ease: "none" }, ${(start + FLIP).toFixed(2)});
      tl.to("#ov${i + 1}", { opacity: 0, duration: 0.16, ease: "power2.in" }, ${(start + SHOT - 0.16).toFixed(2)});
      tl.set("#ov${i + 1}", { opacity: 0 }, ${(start + SHOT).toFixed(2)});`;
}).join("\n");

const opening = readFileSync("videos/kleeto-hero-film/opening.part.html", "utf8");
const openingJs = readFileSync("videos/kleeto-hero-film/opening.part.js", "utf8");
const css = readFileSync("videos/kleeto-hero-film/opening.part.css", "utf8");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1280, height=720" />
    <title>Kleeto — a lease, start to finish</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Azeret+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${css}
      /* ---------------- montage ---------------- */
      .shot-video { position: absolute; inset: 0; width: 1280px; height: 720px; object-fit: cover; background: #171310; }
      .overlay { pointer-events: none; }
      .frame { position: absolute; inset: 0; border: 3px solid oklch(0.8 0.165 85 / 0.85); }
      .frame::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 60px oklch(0.8 0.165 85 / 0.16); }

      .chat { position: absolute; left: 40px; bottom: 34px; display: flex; flex-direction: column; gap: 7px; max-width: 880px; }
      .ask, .did {
        display: flex; align-items: center; gap: 11px; padding: 9px 15px; border-radius: 10px;
        font-family: "Azeret Mono", monospace; font-size: 14px; background: rgba(13, 11, 9, 0.9);
        border: 1px solid oklch(0.86 0.012 85 / 0.16);
      }
      .ask { border-color: oklch(0.86 0.012 85 / 0.2); }
      .ask .tag { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: oklch(0.62 0.014 85); }
      .ask .msg { color: oklch(0.94 0.008 85); }
      .did { border-color: oklch(0.8 0.165 85 / 0.35); }
      .did .app { color: oklch(0.96 0.006 85); }
      .did .what { color: oklch(0.72 0.012 85); }
      .state { display: inline-flex; align-items: center; gap: 8px; }
      .state .pip { width: 8px; height: 8px; border-radius: 50%; background: oklch(0.8 0.165 85); }
      .state .stack { position: relative; display: inline-block; min-width: 9ch; height: 1em; }
      .state .txt { position: absolute; left: 0; top: 0; color: oklch(0.8 0.165 85); white-space: nowrap; letter-spacing: 0.08em; }
      .state .act { opacity: 0; }
      .count {
        position: absolute; right: 40px; bottom: 34px; font-family: "Azeret Mono", monospace; font-size: 14px;
        padding: 9px 13px; border-radius: 10px; background: rgba(13, 11, 9, 0.9);
        border: 1px solid oklch(0.8 0.165 85 / 0.35); color: oklch(0.9 0.008 85);
      }
      .count .of { color: oklch(0.62 0.014 85); }
      .agent-cursor { position: absolute; top: 0; left: 0; display: flex; align-items: flex-start; gap: 6px; }
      .agent-cursor b {
        font-family: "Azeret Mono", monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
        color: #171310; background: oklch(0.8 0.165 85); padding: 3px 7px; border-radius: 5px; transform: translateY(10px);
      }
      #bar { position: absolute; left: 0; top: 0; height: 3px; width: 1280px; transform-origin: 0 50%; background: oklch(0.8 0.165 85); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total.toFixed(2)}" data-width="1280" data-height="720">
${opening}
${videos}
${overlays}
      <div id="bar"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      /* ---- pointer motion -------------------------------------------------------
         Catmull-Rom through the logged points, so the path curves instead of turning
         corners; speed is redistributed so the pointer slows as it reaches a waypoint
         and pushes off again (a hand aims, lands, then moves); and a small smooth
         wobble rides on top, because a real pointer never travels perfectly straight.
         Deterministic — no randomness — so every render is identical.              */
      function catmull(pts, t) {
        const n = pts.length - 1;
        const seg = Math.min(Math.floor(t * n), n - 1);
        const u = t * n - seg;
        const p0 = pts[Math.max(seg - 1, 0)], p1 = pts[seg];
        const p2 = pts[Math.min(seg + 1, n)], p3 = pts[Math.min(seg + 2, n)];
        const u2 = u * u, u3 = u2 * u;
        const f = (a, b, c, d) =>
          0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
      }
      /** Ease within each leg: leave slowly, arrive slowly, hold a beat on arrival. */
      function paced(t, legs) {
        const x = t * legs;
        const i = Math.min(Math.floor(x), legs - 1);
        let u = x - i;
        u = u < 0.82 ? (u / 0.82) : 1;                        // the tail of each leg is a dwell
        u = u * u * (3 - 2 * u);                              // smoothstep in and out
        return (i + u) / legs;
      }
      const walkers = {};
      function walk(id, pts) {
        walkers[id] = { p: 0, id: id, pts: pts, legs: Math.max(pts.length - 1, 1) };
        return walkers[id];
      }
      function walkUpdate() {
        const w = this.targets()[0];
        const t = paced(w.p, w.legs);
        const xy = catmull(w.pts, t);
        // a slow figure-of-eight wobble, a pixel or two wide
        const wob = Math.sin(w.p * 21.7) * 1.6, wobY = Math.cos(w.p * 17.3) * 1.2;
        gsap.set("#cur" + w.id, { x: xy[0] + wob, y: xy[1] + wobY });
      }
      tl.fromTo("#bar", { scaleX: 0 }, { scaleX: 1, duration: ${total.toFixed(2)}, ease: "none" }, 0);
${openingJs}
${timelines}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync("videos/kleeto-hero-film/index.html", html);
console.log(`composition: opening ${OPEN_END}s + ${shots.length} shots = ${total.toFixed(1)}s`);
