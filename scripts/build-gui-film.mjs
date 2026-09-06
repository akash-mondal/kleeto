/**
 * Cuts the GUI montage and writes the HyperFrames composition.
 *
 * Each application gets two seconds. Over the footage sit three things that make it read
 * as an agent rather than a person at a keyboard: a border that pulses while the agent
 * works, a status chip that flips from THINKING to ACTING on the beat the agent actually
 * touches the app, and the agent's own pointer — drawn from the coordinates the script
 * issued during the shoot, not simulated.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const TAKES = [
  { src: "agent-runs/gui/raw.mp4", beats: "agent-runs/gui/beats.json", cursor: "agent-runs/gui/cursor.json" },
  { src: "agent-runs/gui-b/raw.mp4", beats: "agent-runs/gui-b/beats.json", cursor: "agent-runs/gui-b/cursor.json" },
];
const OUT = "videos/kleeto-hero-film/assets/gui";
mkdirSync(OUT, { recursive: true });

const RATE = 2.0;    // twice speed
const SHOT = 1.0;    // one second per application on the timeline (two seconds of source)
const LEAD = 1.75;   // the shot starts this far before the "acting" beat, so it spans the work
const FLIP = 0.3;    // the chip turns from THINKING to ACTING this far into the shot

// One entry per app: the "thinking" beat marks the app being on screen, the "acting"
// beat marks the agent touching it. The two seconds straddle the flip.
const apps = [];
for (const take of TAKES) {
  if (!existsSync(take.beats)) continue;
  const beats = JSON.parse(readFileSync(take.beats, "utf8"));
  const cursor = existsSync(take.cursor) ? JSON.parse(readFileSync(take.cursor, "utf8")) : [];
  for (let i = 0; i < beats.length; i += 1) {
    const b = beats[i];
    if (b.phase !== "thinking") continue;
    const act = beats.slice(i + 1).find((x) => x.app === b.app && x.phase === "acting");
    if (!act) continue;
    apps.push({ app: b.app, label: b.label, at: b.at, actAt: act.at, src: take.src, cursor });
  }
}
const chosen = apps.slice(0, 30);
console.log(`${apps.length} applications shot, using ${chosen.length}`);

/** Cursor positions inside a source window, rebased to the shot's own clock. */
function cursorFor(CURSOR, from, to) {
  return CURSOR.filter((c) => c.t >= from - 0.3 && c.t <= to + 0.3)
    .map((c) => ({ t: +(c.t - from).toFixed(2), x: c.x, y: c.y, k: c.k }));
}

const shots = [];
for (const [i, s] of chosen.entries()) {
  const id = String(i + 1).padStart(2, "0");
  // Start a beat before the agent acts, so the flip to ACTING lands mid-shot.
  const start = Math.max(0.1, Math.min(s.actAt - LEAD, s.at + 0.2));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(start), "-t", String(SHOT * RATE), "-i", s.src,
    "-filter:v", `setpts=PTS/${RATE},fps=24,scale=1280:720`, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-g", "1", "-crf", "20", `${OUT}/${id}.mp4`]);
  const marks = cursorFor(s.cursor, start, start + SHOT * RATE)
    .map((m) => ({ ...m, t: +(m.t / RATE).toFixed(2) }));
  shots.push({ id, app: s.app, label: s.label, flip: FLIP, cursor: marks });
  console.log(`${id} ${s.app.padEnd(22)} @ ${start.toFixed(1)}s  ${marks.length} pointer marks`);
}
writeFileSync(`${OUT}/shots.json`, JSON.stringify(shots, null, 1));

/* ------------------------------------------------------------------ composition ---- */
const videos = shots.map((s, i) =>
  `      <video id="v${i + 1}" class="shot-video" src="assets/gui/${s.id}.mp4" data-start="${(i * SHOT).toFixed(2)}" ` +
  `data-duration="${SHOT.toFixed(2)}" data-track-index="${i % 2}" muted playsinline></video>`).join("\n");

const overlays = shots.map((s, i) => {
  const start = i * SHOT;
  return `      <div id="ov${i + 1}" class="clip overlay" data-start="${start.toFixed(2)}" data-duration="${SHOT.toFixed(2)}" data-track-index="4">
        <div class="frame"></div>
        <div class="hud">
          <span class="state"><span class="pip"></span><span class="stack"><span class="txt think" id="th${i + 1}">THINKING</span><span class="txt act" id="ac${i + 1}">ACTING</span></span></span>
          <span class="app">${s.app}</span><span class="what">${s.label}</span>
        </div>
        <div class="count">${String(i + 1).padStart(2, "0")}<span class="of">/${shots.length}</span></div>
        <span class="agent-cursor" id="cur${i + 1}"><svg viewBox="0 0 12 18" width="12" height="18"><path d="M1 1 L1 15 L4.5 11.6 L7 17 L9.4 15.9 L6.9 10.8 L11 10.6 Z" fill="#171310" stroke="#f5b301" stroke-width="1.2"/></svg><b>agent</b></span>
      </div>`;
}).join("\n");

const timelines = shots.map((s, i) => {
  const start = i * SHOT;
  const c = s.cursor;
  const moves = c.length
    ? c.map((p) => `        tl.to("#cur${i + 1}", { x: ${p.x}, y: ${p.y}, duration: 0.28, ease: "power2.out" }, ${(start + Math.min(p.t, SHOT - 0.05)).toFixed(2)});`).join("\n")
    : `        tl.to("#cur${i + 1}", { x: 700, y: 400, duration: 1.2, ease: "power2.inOut" }, ${(start + 0.3).toFixed(2)});`;
  const first = c[0] ?? { x: 640, y: 380 };
  return `        tl.set("#cur${i + 1}", { x: ${first.x}, y: ${first.y} }, ${start.toFixed(2)});
        tl.from("#ov${i + 1} .hud", { opacity: 0, y: 8, duration: 0.25, ease: "power3.out" }, ${start.toFixed(2)});
        tl.from("#ov${i + 1} .count", { opacity: 0, duration: 0.25 }, ${start.toFixed(2)});
${moves}
        tl.set("#th${i + 1}", { opacity: 1 }, ${start.toFixed(2)});
        tl.set("#ac${i + 1}", { opacity: 0 }, ${start.toFixed(2)});
        tl.to("#th${i + 1}", { opacity: 0, duration: 0.14, ease: "none" }, ${(start + s.flip).toFixed(2)});
        tl.to("#ac${i + 1}", { opacity: 1, duration: 0.14, ease: "none" }, ${(start + s.flip).toFixed(2)});
        tl.to("#ov${i + 1} .state .pip", { backgroundColor: "oklch(0.88 0.2 100)", duration: 0.14, ease: "none" }, ${(start + s.flip).toFixed(2)});
        tl.to("#ov${i + 1}", { opacity: 0, duration: 0.18, ease: "power2.in" }, ${(start + SHOT - 0.18).toFixed(2)});
        tl.set("#ov${i + 1}", { opacity: 0 }, ${(start + SHOT).toFixed(2)});`;
}).join("\n");

const total = shots.length * SHOT;
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1280, height=720" />
    <title>Kleeto — an agent, thirty applications</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Azeret+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1280px; height: 720px; overflow: hidden; background: #171310; }
      body { font-family: Archivo, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
      #root { position: relative; width: 1280px; height: 720px; overflow: hidden; background: #171310; }
      .clip { position: absolute; inset: 0; }
      /* Pinned: a video left in normal flow gets pushed off-canvas when two are laid out at once. */
      .shot-video { position: absolute; inset: 0; width: 1280px; height: 720px; object-fit: cover; background: #171310; }
      .overlay { pointer-events: none; }

      /* The border says a machine is holding this screen. */
      .frame { position: absolute; inset: 0; border: 3px solid oklch(0.8 0.165 85 / 0.85); }
      .frame::after {
        content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 60px oklch(0.8 0.165 85 / 0.16);
      }

      .hud {
        position: absolute; left: 40px; bottom: 36px; display: flex; align-items: center; gap: 12px;
        font-family: "Azeret Mono", monospace; font-size: 15px; padding: 10px 16px; border-radius: 9px;
        background: rgba(13, 11, 9, 0.88); border: 1px solid oklch(0.8 0.165 85 / 0.35); color: oklch(0.9 0.008 85);
      }
      .state { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; letter-spacing: 0.08em; }
      .state .pip { width: 8px; height: 8px; border-radius: 50%; background: oklch(0.8 0.165 85); }
      .state .stack { position: relative; display: inline-block; min-width: 9ch; height: 1em; }
      .state .txt { position: absolute; left: 0; top: 0; color: oklch(0.8 0.165 85); white-space: nowrap; }
      .state .act { opacity: 0; }
      .hud .app { color: oklch(0.96 0.006 85); }
      .hud .what { color: oklch(0.72 0.012 85); }
      .count {
        position: absolute; right: 40px; bottom: 36px; font-family: "Azeret Mono", monospace; font-size: 15px;
        padding: 10px 14px; border-radius: 9px; background: rgba(13, 11, 9, 0.88);
        border: 1px solid oklch(0.8 0.165 85 / 0.35); color: oklch(0.9 0.008 85);
      }
      .count .of { color: oklch(0.62 0.014 85); }

      /* The agent's pointer, at the coordinates the agent actually drove. */
      .agent-cursor { position: absolute; top: 0; left: 0; display: flex; align-items: flex-start; gap: 6px; }
      .agent-cursor b {
        font-family: "Azeret Mono", monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
        color: #171310; background: oklch(0.8 0.165 85); padding: 3px 7px; border-radius: 5px;
        transform: translateY(10px);
      }
      #bar { position: absolute; left: 0; top: 0; height: 3px; width: 1280px; transform-origin: 0 50%; background: oklch(0.8 0.165 85); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1280" data-height="720">
${videos}
${overlays}
      <div id="bar"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#bar", { scaleX: 0 }, { scaleX: 1, duration: ${total}, ease: "none" }, 0);
${timelines}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync("videos/kleeto-hero-film/index.html", html);
console.log(`\ncomposition written: ${shots.length} shots, ${total}s`);
