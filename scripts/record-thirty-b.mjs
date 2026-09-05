/**
 * Second pass: re-shoots the fourteen beats that failed in take A.
 *
 * Fixes, in order of how much time they cost: every LibreOffice app now gets its own
 * profile (killing Calc hard in take A left a crash-recovery dialog in front of every
 * later LibreOffice launch); window matches are specific ("File Manager", not "out",
 * which matched "ab-out-:blank"); tmux runs from a script instead of inline escapes; and
 * the TUI programs get a real key press instead of shell job control.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const OUT = "agent-runs/thirty-b";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) { log("sweeping", s.sandboxId.slice(0, 12)); await a.sandboxes.kill(s.sandboxId).catch(() => {}); }
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "thirty-b" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
log("up:", lease.id.slice(0, 14), "…");

const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const full = (m) => X(`wmctrl -r '${m}' -b add,fullscreen; true`).catch(() => {});
const focus = (m) => X(`id=$(xdotool search --onlyvisible --name '${m}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const type = async (t, enter = true) => { await d.keyboard.type(t); if (enter) await d.keyboard.press("Return"); };
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };

let recStart = 0;
const beats = [];
const beat = async (app, note) => {
  const at = (Date.now() - recStart) / 1000;
  beats.push({ n: beats.length + 1, app, note, at: +at.toFixed(2) });
  log(`  ${String(beats.length).padStart(2)}. ${app.padEnd(18)} @ ${at.toFixed(1)}s`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};
async function gui(app, launch, { wait = 6000, act = async () => {}, match, note, closeFirst = [] }) {
  for (const m of closeFirst) { await kill(m); }
  if (closeFirst.length) await sleep(1200);
  await launch();
  await sleep(wait);
  if (match) { await full(match); await sleep(900); await focus(match); }
  await act();
  await beat(app, note);
  await sleep(1500);
  if (match) { await kill(match); await sleep(900); }
}
async function term(app, cmd, { wait = 3200, note, clear = true } = {}) {
  await focus("Terminal");
  if (clear) { await type("clear"); await sleep(350); }
  await type(cmd);
  await sleep(wait);
  await beat(app, note);
  await sleep(800);
}

try {
  await lease.channel();
  await d.health();
  log("installing");
  await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl htop tmux git bat zip jq",
    { pollMs: 6000, timeoutMs: 900_000 }).catch((e) => log("  apt:", e.message.slice(0, 80)));
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await sh("mkdir -p /work/out && cd /work/out && (test -f render.png || cp frame_0001.png render.png 2>/dev/null); zip -q -j /work/out/outputs.zip /work/out/*.png /work/out/*.blend 2>/dev/null; ls /work/out").catch(() => {});
  // A real script, so tmux is not fighting shell escaping on camera.
  await lease.writeFile("/work/tmux-demo.sh", `#!/bin/bash
tmux kill-server 2>/dev/null
tmux new-session -d -s kleeto 'top -b -d 1'
tmux split-window -t kleeto -v 'watch -n1 df -h /work'
tmux split-window -t kleeto -h 'tail -f /var/log/dpkg.log'
tmux list-panes -t kleeto
tmux list-sessions
`);
  await sh("chmod +x /work/tmux-demo.sh");
  // Inkscape's first run opens a welcome wizard; pre-seeding the preference skips it.
  await sh(`mkdir -p /root/.config/inkscape && cat > /root/.config/inkscape/preferences.xml <<'XML'
<inkscape version="1.1" >
  <group id="options">
    <group id="boot" welcome="0" />
  </group>
</inkscape>
XML
true`).catch(() => {});
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
  await sleep(3500); await full("Terminal"); await sleep(1000);

  /* --- shell beats that needed a real TTY or a working URL --------------------- */
  await focus("Terminal");
  await type("clear"); await sleep(300);
  await type("htop -d 10");
  await sleep(4000);
  await beat("htop", "what is running");
  await d.keyboard.press("q").catch(() => {});
  await sleep(1200);

  await term("git", "GIT_TERMINAL_PROMPT=0 git clone -q --depth 1 https://github.com/octocat/Hello-World /work/hello 2>&1 | tail -2; git -C /work/hello log --oneline -3; git -C /work/hello status -sb", { wait: 7000, note: "a repository, cloned" });
  await term("node", "node -e \"const c=require('crypto');console.log('sha256', c.createHash('sha256').update('kleeto').digest('hex'));console.log('node', process.version)\"", { note: "JavaScript, same box" });
  await term("bat", "batcat --style=numbers,grid --color=always /work/collect.py 2>/dev/null | head -22 || batcat --style=numbers /etc/os-release", { wait: 3000, note: "source, highlighted" });
  await term("tmux", "/work/tmux-demo.sh", { wait: 4000, note: "panes and sessions" });

  /* --- GUI beats --------------------------------------------------------------- */
  await kill("Terminal"); await sleep(1000);

  await gui("Chrome (maps)", () => d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check", "--start-fullscreen", "https://www.openstreetmap.org/#map=16/48.8584/2.2945"]).catch(() => {}),
    { wait: 13000, match: "OpenStreetMap", note: "a map, panned",
      act: async () => { await kill("Welcome to Google Chrome"); await sleep(600); await d.mouse.drag({ x: 800, y: 430 }, { x: 590, y: 320 }).catch(() => {}); await sleep(1500); } });

  // A fresh profile per app: no shared crash-recovery state, so no recovery dialog.
  await gui("LibreOffice Writer", () => d.open("libreoffice", ["--writer", "--norestore", "-env:UserInstallation=file:///tmp/lo-w"]).catch(() => {}),
    { wait: 17000, match: "LibreOffice Writer", note: "a document, typed", closeFirst: ["Google Chrome"],
      act: async () => { await kill("Tip of the Day"); await sleep(500); await type("Kleeto — lease report", false); await sleep(1400); } });

  await gui("LibreOffice Impress", () => d.open("libreoffice", ["--impress", "--norestore", "-env:UserInstallation=file:///tmp/lo-i"]).catch(() => {}),
    { wait: 17000, match: "Impress", note: "slides",
      act: async () => { await kill("Select a Template"); await kill("Tip of the Day"); await sleep(700); await type("Rented by the second", false); await sleep(1200); } });

  await gui("LibreOffice Draw", () => d.open("libreoffice", ["--draw", "--norestore", "-env:UserInstallation=file:///tmp/lo-d"]).catch(() => {}),
    { wait: 16000, match: "LibreOffice Draw", note: "vector shapes",
      act: async () => { await kill("Tip of the Day"); await sleep(500); await d.mouse.drag({ x: 480, y: 300 }, { x: 780, y: 500 }).catch(() => {}); await sleep(1000); } });

  await gui("Thunar", () => d.open("thunar", ["/work/out"]).catch(() => {}),
    { wait: 7000, match: "File Manager", note: "files on disk" });

  await gui("Ristretto", () => d.open("ristretto", ["/work/out/render.png"]).catch(() => {}),
    { wait: 7000, match: "Ristretto", note: "the render, viewed",
      act: async () => { await d.keyboard.press("Return").catch(() => {}); await sleep(800); } });

  await gui("Xarchiver", () => d.open("xarchiver", ["/work/out/outputs.zip"]).catch(() => {}),
    { wait: 7000, match: "outputs.zip", note: "an archive of the outputs" });

  await gui("Inkscape", () => d.process.start("inkscape /work/out/drawing.svg").catch(() => d.open("inkscape")),
    { wait: 20000, match: "Inkscape", note: "vector editing",
      act: async () => { await kill("Quick Setup"); await sleep(800); await d.keyboard.press("s").catch(() => {}); await d.mouse.drag({ x: 520, y: 320 }, { x: 800, y: 520 }).catch(() => {}); await sleep(1200); } });

  await gui("Blender", () => d.process.start("blender /work/out/scene.blend").catch(() => {}),
    { wait: 26000, match: "Blender", note: "3D, driven by hand", closeFirst: ["Inkscape"],
      act: async () => { await d.keyboard.press("Escape").catch(() => {}); await sleep(900);
        for (const dx of [70, 140]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 355 }, "middle").catch(() => {}); await sleep(500); }
        await d.keyboard.press("KP_0").catch(() => {}); await sleep(1800); } });

  await beat("wrap", "end");
  await sleep(1200);
  const st = await d.record.stop().catch(() => null);
  log("finalized:", st?.path, st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/raw.mp4`, Buffer.from(await r.arrayBuffer())); log("saved raw.mp4"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  console.table(beats.map((b) => ({ n: b.n, app: b.app, at: b.at })));
} finally {
  log("tearing down");
  await lease.terminate().catch(() => {});
}
log("done");
