/**
 * Cuts the montage: thirty applications, two seconds each, from five takes.
 *
 * Shots keyed by `key` look their timestamp up in that take's beats.json and back up a
 * little, so the two seconds land on the work rather than after it. Shots with a literal
 * `at` were timed by hand against the take.
 */
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync } from "node:fs";

const TAKES = {
  A: "agent-runs/thirty/raw.mp4",
  B: "agent-runs/thirty-b/raw.mp4",
  C: "agent-runs/thirty-c/raw.mp4",
  D: "agent-runs/thirty-d/raw.mp4",
  E: "agent-runs/thirty-e/raw.mp4",
  F: "agent-runs/thirty-f/raw.mp4",
};
const BEATS = Object.fromEntries(Object.entries(TAKES).map(([k, v]) => {
  const p = v.replace("raw.mp4", "beats.json");
  return [k, existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : []];
}));
const OUT = "videos/kleeto-hero-film/assets/thirty";
mkdirSync(OUT, { recursive: true });
const SHOT = 2.0;

export const SHOTS = [
  // ---- take A, timed by hand
  { take: "A", at: 12.6,  app: "neofetch",    label: "the machine introduces itself" },
  { take: "A", at: 34.2,  app: "tree",        label: "the working directory" },
  { take: "A", at: 42.5,  app: "curl + jq",   label: "a live API, parsed" },
  { take: "A", at: 52.4,  app: "python",      label: "arithmetic in the REPL" },
  { take: "A", at: 74.3,  app: "sqlite3",     label: "a database, queried" },
  { take: "A", at: 107.2, app: "ffmpeg",      label: "encoding video" },
  { take: "A", at: 127.3, app: "blender -b",  label: "a render with no display" },
  { take: "A", at: 137.0, app: "sha256sum",   label: "hashing what it made" },
  { take: "A", at: 168.9, app: "vim",         label: "an editor with no mouse" },
  { take: "A", at: 187.2, app: "http.server", label: "a server, answering" },
  { take: "A", at: 200.3, app: "figlet",      label: "because the shell is real" },
  { take: "A", at: 226.6, app: "Chrome",      label: "reading a live page" },
  { take: "A", at: 295.5, app: "LibreOffice Calc", label: "a spreadsheet" },
  { take: "A", at: 398.6, app: "Evince",      label: "a PDF it produced" },
  { take: "A", at: 435.9, app: "Mousepad",    label: "a text editor" },
  { take: "A", at: 477.6, app: "Galculator",  label: "a calculator, clicked" },
  { take: "A", at: 535.6, app: "GIMP",        label: "image editing" },
  // ---- take B, keyed to its beats
  { take: "B", key: "htop",          app: "htop",       label: "what is running" },
  { take: "B", key: "git",           app: "git",        label: "a repository, cloned" },
  { take: "B", key: "tmux",          app: "tmux",       label: "panes and sessions" },
  { take: "B", key: "Chrome (maps)", app: "Chrome",     label: "a map, panned" },
  { take: "B", key: "Thunar",        app: "Thunar",     label: "files on disk" },
  { take: "B", key: "Xarchiver",     app: "Xarchiver",  label: "an archive of the outputs" },
  { take: "B", key: "Blender",       app: "Ristretto",  label: "the render, viewed", lead: 0.4 },
  // ---- takes C, D, E, F
  { take: "C", key: "node",              app: "node",      label: "JavaScript, same box" },
  { take: "E", key: "Blender",           app: "Blender",   label: "3D, driven by hand" },
  { take: "E", key: "xfce4-taskmanager", app: "Task Manager", label: "processes on the machine" },
  { take: "F", key: "ncdu",              app: "ncdu",      label: "where the disk went" },
  { take: "F", key: "nano",              app: "nano",      label: "a file, edited in place" },
  { take: "F", key: "top",               app: "top",       label: "load, memory, processes" },
];

if (process.argv[1]?.endsWith("cut-thirty.mjs")) {
  const kept = [];
  for (const s of SHOTS) {
    const src = TAKES[s.take];
    if (!existsSync(src)) { console.log(`-- ${s.app}: take ${s.take} missing`); continue; }
    let at = s.at;
    if (s.key) {
      const b = BEATS[s.take].find((x) => x.app === s.key);
      if (!b) { console.log(`-- ${s.app}: no beat "${s.key}" in take ${s.take}`); continue; }
      at = Math.max(0.2, b.at - (s.lead ?? 1.3));
    }
    const id = String(kept.length + 1).padStart(2, "0");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(at), "-t", String(SHOT), "-i", src,
      "-filter:v", "fps=24,scale=1280:720", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-g", "1", "-crf", "20", `${OUT}/${id}.mp4`]);
    kept.push({ id, ...s, at: +at.toFixed(2) });
    console.log(`${id} ${s.app.padEnd(20)} take ${s.take} @ ${at.toFixed(1)}s`);
  }
  execSync(`echo '${JSON.stringify(kept, null, 1).replace(/'/g, "")}' > ${OUT}/shots.json`);
  console.log(`\n${kept.length} shots x ${SHOT}s = ${(kept.length * SHOT).toFixed(0)}s`);
}
