/**
 * Top-up: the seven GUI apps that did not land, so the montage reaches thirty.
 * Fixes are all about identification and patience — window titles rarely contain the
 * program's name (Meld titles itself after the two files it is diffing, Epiphany after
 * the page), and the heavier apps need more than seventy seconds on a cold profile.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/gui-b";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "gui-b" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const activeName = async () => String(await X("xdotool getactivewindow getwindowname 2>/dev/null || true").catch(() => "")).trim();
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };

let recStart = 0;
const beats = [], cursor = [];
const now = () => +((Date.now() - recStart) / 1000).toFixed(2);
const mouse = {
  async move(x, y) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.move(x, y).catch(() => {}); },
  async click(x, y) { cursor.push({ t: now(), x, y, k: "click" }); await d.mouse.click(x, y).catch(() => {}); },
  async drag(f, t2) { cursor.push({ t: now(), ...f, k: "down" }); await d.mouse.drag(f, t2).catch(() => {}); cursor.push({ t: now(), ...t2, k: "up" }); },
};
const beat = async (app, label, phase) => {
  const at = now();
  beats.push({ n: beats.length + 1, app, label, phase, at });
  log(`  ${app.padEnd(20)} ${phase.padEnd(9)} @ ${at.toFixed(1)}s`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};
async function waitWindow(match, max) {
  const s = Date.now();
  while (Date.now() - s < max) {
    const id = String(await X(`xdotool search --onlyvisible --name '${match}' | head -1`).catch(() => "")).trim();
    if (id) return id.split("\n")[0];
    await sleep(1500);
  }
  return null;
}
const DIALOGS = ["Tip of the Day", "Select a Template", "Quick Setup", "Privacy", "Welcome", "Document Recovery"];
async function present(id, match) {
  await X(`xdotool windowmap ${id} 2>/dev/null; xdotool windowactivate --sync ${id} 2>/dev/null; xdotool windowraise ${id} 2>/dev/null; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
  await sleep(1800);
  for (const dlg of DIALOGS) await kill(dlg);
  await sleep(600);
  await X(`xdotool windowactivate --sync ${id} 2>/dev/null; true`).catch(() => {});
  await sleep(700);
  const n = await activeName();
  return new RegExp(match, "i").test(n) ? n : null;
}

try {
  await lease.channel(); await d.health();
  log("up:", lease.id.slice(0, 14));
  await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl abiword meld vlc epiphany-browser",
    { pollMs: 8000, timeoutMs: 1_500_000 }).catch((e) => log("apt:", e.message.slice(0, 70)));
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /work/out && cd /work/out && (test -f render.png || cp frame_0001.png render.png 2>/dev/null); true").catch(() => {});
  await lease.writeFile("/work/out/report.txt", "Kleeto — lease report\n\nlane        desktop-4\nseconds     252\namount      $0.0104\nfiles out   7\n");
  await lease.writeFile("/work/out/notes.md", "Kleeto — lease report\n\nlane        desktop-4\nseconds     252\namount      $0.0104\nfiles out   8\nchecked     yes\n");
  await sh("cd /work/out && ffmpeg -v error -y -loop 1 -i render.png -t 8 -vf scale=800:-2 -pix_fmt yuv420p clip.mp4 2>/dev/null; ls clip.mp4").catch(() => {});
  await sh("pkill -f soffice; true").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  const APPS = [
    { app: "GIMP", label: "editing the render", match: "GIMP", wait: 110000,
      launch: () => d.open("gimp", ["/work/out/render.png"]),
      act: async () => { await mouse.move(700, 420); await sleep(700); await mouse.click(640, 400); } },
    { app: "VLC", label: "playing the clip it made", match: "VLC|clip.mp4", wait: 70000,
      launch: () => d.open("vlc", ["--no-qt-privacy-ask", "--no-qt-updates-notif", "/work/out/clip.mp4"]),
      act: async () => { await sleep(1200); await mouse.move(640, 620); await sleep(600); } },
    { app: "Meld", label: "diffing two files", match: "Meld|report|notes", wait: 70000,
      launch: () => d.open("meld", ["/work/out/report.txt", "/work/out/notes.md"]),
      act: async () => { await mouse.move(640, 380); await sleep(700); await mouse.click(500, 320); } },
    { app: "AbiWord", label: "a word processor", match: "AbiWord|report", wait: 70000,
      launch: () => d.open("abiword", ["/work/out/report.txt"]),
      act: async () => { await mouse.click(500, 300); await sleep(700); } },
    { app: "Epiphany", label: "a second browser", match: "Epiphany|Web|Hacker", wait: 70000,
      launch: () => d.open("epiphany-browser", ["https://news.ycombinator.com/"]),
      act: async () => { await mouse.move(640, 400); await sleep(800); } },
    { app: "LibreOffice Impress", label: "slides", match: "Impress", wait: 80000,
      launch: async () => { await sh("pkill -f soffice; sleep 1.2; true").catch(() => {}); await d.open("libreoffice", ["--impress", "--norestore", "--nologo", "-env:UserInstallation=file:///tmp/lo-imp2"]); },
      act: async () => { await kill("Select a Template"); await sleep(900); await mouse.click(640, 380); } },
    { app: "Ristretto", label: "an image viewer", match: "Ristretto|render", wait: 45000,
      launch: () => d.open("ristretto", ["/work/out/render.png"]),
      act: async () => { await d.keyboard.press("Return"); await sleep(800); await mouse.move(660, 380); } },
  ];

  let kept = 0;
  for (const it of APPS) {
    await it.launch().catch((e) => log(`  ${it.app} launch:`, e.message.slice(0, 50)));
    const id = await waitWindow(it.match, it.wait);
    if (!id) { log(`  ${it.app}: no window`); continue; }
    await sleep(2500);
    const name = await present(id, it.match);
    if (!name) { log(`  ${it.app}: never took the screen`); await X(`xdotool windowkill ${id}; true`).catch(() => {}); await sleep(900); continue; }
    log(`  ${it.app}: "${name}"`);
    await beat(it.app, it.label, "thinking");
    await it.act().catch(() => {});
    await sleep(900);
    await beat(it.app, it.label, "acting");
    kept += 1;
    await sleep(900);
    await X(`xdotool windowkill ${id}; true`).catch(() => {});
    await sleep(1500);
  }
  log(`kept ${kept}`);

  const st = await d.record.stop().catch(() => null);
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/raw.mp4`, Buffer.from(await r.arrayBuffer())); log("saved raw.mp4", (st.sizeBytes / 1e6).toFixed(1), "MB"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  writeFileSync(`${OUT}/cursor.json`, JSON.stringify(cursor, null, 1));
} finally { await lease.terminate().catch(() => {}); }
log("done");
