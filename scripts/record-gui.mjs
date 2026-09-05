/**
 * Shoots the GUI montage: only windowed applications, no terminals.
 *
 * Two things the earlier takes taught us are baked in here:
 *  - LibreOffice runs one process for all its apps. A headless `soffice` left over from a
 *    document conversion swallows the next `--writer` call and the window never maps, so
 *    every LibreOffice launch kills soffice first and uses its own profile.
 *  - A window existing is not the same as a window being on screen. Each app is mapped,
 *    raised, fullscreened and then *verified* by reading the active window's title back;
 *    if it does not match, the app is skipped rather than shot blind.
 *
 * Every pointer move the agent makes is logged with a timestamp, so the edit can draw the
 * agent's own cursor on top of the footage.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/gui";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 4_500_000, metadata: { kleeto: "gui" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
log("up:", lease.id.slice(0, 14));

const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const activeName = async () => String(await X("xdotool getactivewindow getwindowname 2>/dev/null || true").catch(() => "")).trim();
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };

let recStart = 0;
const beats = [];
const cursor = [];                       // every pointer position the agent produced
const now = () => +((Date.now() - recStart) / 1000).toFixed(2);
/** Mouse wrappers that log where the agent put the pointer, and when. */
const mouse = {
  async move(x, y) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.move(x, y).catch(() => {}); },
  async click(x, y) { cursor.push({ t: now(), x, y, k: "click" }); await d.mouse.click(x, y).catch(() => {}); },
  async drag(from, to, button) {
    cursor.push({ t: now(), ...from, k: "down" });
    await d.mouse.drag(from, to, button).catch(() => {});
    cursor.push({ t: now(), ...to, k: "up" });
  },
};
const beat = async (app, label, phase) => {
  const at = now();
  beats.push({ n: beats.length + 1, app, label, phase, at });
  log(`  ${String(beats.length).padStart(2)}. ${app.padEnd(22)} @ ${at.toFixed(1)}s`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};
async function waitWindow(match, max) {
  const started = Date.now();
  while (Date.now() - started < max) {
    const id = String(await X(`xdotool search --onlyvisible --name '${match}' | head -1`).catch(() => "")).trim();
    if (id) return id.split("\n")[0];
    await sleep(1200);
  }
  return null;
}
const DIALOGS = ["Tip of the Day", "Select a Template", "Quick Setup", "Welcome to Google Chrome",
  "Document Recovery", "What.s New", "Welcome", "Donate", "Crash"];

/** Put the app on screen and prove it is there before shooting. */
async function present(id, match) {
  await X(`xdotool windowmap ${id} 2>/dev/null; xdotool windowactivate --sync ${id} 2>/dev/null; ` +
          `xdotool windowraise ${id} 2>/dev/null; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
  await sleep(1600);
  for (const dlg of DIALOGS) await kill(dlg);
  await sleep(500);
  await X(`xdotool windowactivate --sync ${id} 2>/dev/null; true`).catch(() => {});
  await sleep(600);
  const name = await activeName();
  return new RegExp(match, "i").test(name) ? name : null;
}

try {
  await lease.channel();
  await d.health();
  log("installing the GUI set — this is the slow part, and it happens before the camera rolls");
  await lease.runLong(
    "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq " +
    "wmctrl gnumeric abiword geany meld gedit eog gthumb baobab gnome-system-monitor vlc dia " +
    "sqlitebrowser epiphany-browser gucharmap gcolor3 file-roller gnome-disk-utility gnome-calculator " +
    "gnome-characters pdfarranger",
    { pollMs: 8000, timeoutMs: 2_400_000 }
  ).catch((e) => log("  apt:", e.message.slice(0, 90)));
  log("  installed:", (await sh("for b in gnumeric abiword geany meld gedit eog gthumb baobab gnome-system-monitor vlc dia sqlitebrowser epiphany-browser gucharmap gcolor3 file-roller gnome-calculator pdfarranger; do command -v $b >/dev/null && printf '%s ' $b; done")).trim());

  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});

  // Material for the apps to open.
  await sh("mkdir -p /work/out && cd /work/out && (test -f render.png || cp frame_0001.png render.png 2>/dev/null); true").catch(() => {});
  await lease.writeFile("/work/out/report.txt",
    "Kleeto — lease report\n\nlane        desktop-4\nseconds     252\namount      $0.0104\nfiles out   7\n\nRendered, hashed and receipted on a rented desktop.\n");
  await lease.writeFile("/work/out/data.csv", "story,points,comments\nOCaml,70,29\nBlender,204,65\nHedera,157,52\nRust,59,18\n");
  await lease.writeFile("/work/out/app.py", "import hashlib\n\ndef digest(path):\n    h = hashlib.sha256()\n    with open(path, 'rb') as fh:\n        for chunk in iter(lambda: fh.read(65536), b''):\n            h.update(chunk)\n    return h.hexdigest()\n\nif __name__ == '__main__':\n    print(digest('/work/out/render.png'))\n");
  await lease.writeFile("/work/out/drawing.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520"><rect width="800" height="520" fill="#fff"/><circle cx="250" cy="250" r="140" fill="#f5b301"/><rect x="380" y="140" width="300" height="220" rx="24" fill="#17140f"/></svg>`);
  await sh("cd /work/out && cp report.txt notes.md; zip -q -j outputs.zip render.png scene.blend 2>/dev/null; " +
    "sqlite3 lease.sqlite 'create table if not exists runs(lane text, seconds int, usd real); insert into runs values(\"desktop-4\",252,0.0104),(\"browser-fast\",96,0.0029);' 2>/dev/null; " +
    "ffmpeg -v error -y -loop 1 -i render.png -t 6 -vf scale=800:-2 -pix_fmt yuv420p clip.mp4 2>/dev/null; " +
    "libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to pdf report.txt >/dev/null 2>&1; " +
    "libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to ods data.csv >/dev/null 2>&1; ls /work/out").then((o) => log("  material:", o.trim().replace(/\n/g, " ")));
  // Nothing may be holding the LibreOffice IPC socket when the GUI apps launch.
  await sh("pkill -f soffice; sleep 1; true").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  const lo = (flag, file, prof) => async () => {
    await sh("pkill -f soffice; sleep 1.2; true").catch(() => {});
    await d.open("libreoffice", [flag, "--norestore", "--nologo", `-env:UserInstallation=file:///tmp/${prof}`, ...(file ? [file] : [])]).catch(() => {});
  };

  const APPS = [
    { app: "Google Chrome", label: "reading a live page", match: "Wikipedia|Chrome", wait: 40000,
      launch: () => d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check", "--start-fullscreen", "https://en.wikipedia.org/wiki/Blender_(software)"]),
      act: async () => { await d.keyboard.press("Page_Down"); await sleep(900); await mouse.move(700, 420); } },
    { app: "Epiphany", label: "a second browser engine", match: "Web|Epiphany", wait: 40000,
      launch: () => d.open("epiphany-browser", ["https://news.ycombinator.com/"]),
      act: async () => { await mouse.move(640, 380); await sleep(600); } },
    { app: "LibreOffice Calc", label: "a spreadsheet", match: "Calc", wait: 60000,
      launch: lo("--calc", "/work/out/data.ods", "lo-calc"),
      act: async () => { await mouse.click(300, 260); await sleep(500); } },
    { app: "LibreOffice Writer", label: "a document", match: "Writer", wait: 60000,
      launch: lo("--writer", "/work/out/report.pdf".replace(".pdf", ".txt"), "lo-writer"),
      act: async () => { await mouse.click(500, 320); await sleep(500); } },
    { app: "LibreOffice Impress", label: "slides", match: "Impress", wait: 60000,
      launch: lo("--impress", null, "lo-impress"),
      act: async () => { await mouse.click(640, 380); await sleep(600); } },
    { app: "LibreOffice Draw", label: "vector shapes", match: "Draw", wait: 60000,
      launch: lo("--draw", null, "lo-draw"),
      act: async () => { await mouse.drag({ x: 470, y: 300 }, { x: 800, y: 520 }); await sleep(600); } },
    { app: "GIMP", label: "editing the render", match: "GIMP", wait: 70000,
      launch: () => d.open("gimp", ["/work/out/render.png"]),
      act: async () => { await mouse.move(700, 420); await sleep(700); } },
    { app: "Blender", label: "3D, driven by hand", match: "Blender", wait: 75000,
      launch: () => d.open("blender", ["/work/out/scene.blend"]),
      act: async () => { await d.keyboard.press("Escape"); await sleep(700);
        for (const dx of [70, 140]) { await mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 355 }, "middle"); await sleep(400); }
        await d.keyboard.press("KP_0"); await sleep(1200); } },
    { app: "Inkscape", label: "vector editing", match: "Inkscape", wait: 60000,
      launch: () => d.open("inkscape", ["/work/out/drawing.svg"]),
      act: async () => { await d.keyboard.press("Return"); await sleep(900); await kill("Quick Setup"); await sleep(800); await mouse.move(640, 400); } },
    { app: "Gnumeric", label: "another spreadsheet", match: "Gnumeric", wait: 40000,
      launch: () => d.open("gnumeric", ["/work/out/data.csv"]),
      act: async () => { await d.keyboard.press("Return"); await sleep(700); await mouse.click(300, 250); } },
    { app: "AbiWord", label: "a word processor", match: "AbiWord", wait: 40000,
      launch: () => d.open("abiword", ["/work/out/report.txt"]),
      act: async () => { await mouse.click(500, 300); await sleep(500); } },
    { app: "Geany", label: "an IDE", match: "Geany", wait: 40000,
      launch: () => d.open("geany", ["/work/out/app.py"]),
      act: async () => { await mouse.click(600, 300); await sleep(500); } },
    { app: "gedit", label: "a text editor", match: "gedit|report", wait: 40000,
      launch: () => d.open("gedit", ["/work/out/report.txt"]),
      act: async () => { await mouse.click(500, 300); await sleep(500); } },
    { app: "Meld", label: "diffing two files", match: "Meld", wait: 40000,
      launch: () => d.open("meld", ["/work/out/report.txt", "/work/out/notes.md"]),
      act: async () => { await mouse.move(640, 400); await sleep(600); } },
    { app: "Mousepad", label: "a lighter editor", match: "Mousepad|notes", wait: 30000,
      launch: () => d.open("mousepad", ["/work/out/notes.md"]),
      act: async () => { await mouse.click(400, 280); await sleep(500); } },
    { app: "Evince", label: "a PDF it produced", match: "report.pdf|Document Viewer", wait: 35000,
      launch: () => d.open("evince", ["/work/out/report.pdf"]),
      act: async () => { await mouse.move(640, 400); await sleep(600); } },
    { app: "Eye of GNOME", label: "the render, full size", match: "render.png|Image Viewer", wait: 35000,
      launch: () => d.open("eog", ["/work/out/render.png"]),
      act: async () => { await mouse.move(660, 380); await sleep(600); } },
    { app: "gThumb", label: "browsing the outputs", match: "gThumb", wait: 40000,
      launch: () => d.open("gthumb", ["/work/out"]),
      act: async () => { await mouse.move(500, 400); await sleep(600); } },
    { app: "Ristretto", label: "an image viewer", match: "Ristretto|render.png", wait: 35000,
      launch: () => d.open("ristretto", ["/work/out/render.png"]),
      act: async () => { await d.keyboard.press("Return"); await sleep(700); } },
    { app: "Thunar", label: "files on disk", match: "File Manager|out", wait: 35000,
      launch: () => d.open("thunar", ["/work/out"]),
      act: async () => { await mouse.click(300, 250); await sleep(600); } },
    { app: "File Roller", label: "inside the archive", match: "outputs.zip|Archive Manager", wait: 40000,
      launch: () => d.open("file-roller", ["/work/out/outputs.zip"]),
      act: async () => { await mouse.move(500, 300); await sleep(600); } },
    { app: "Xarchiver", label: "another archiver", match: "Xarchiver|outputs", wait: 35000,
      launch: () => d.open("xarchiver", ["/work/out/outputs.zip"]),
      act: async () => { await mouse.move(520, 320); await sleep(600); } },
    { app: "VLC", label: "playing the clip it made", match: "VLC", wait: 45000,
      launch: () => d.open("vlc", ["--no-qt-privacy-ask", "--play-and-exit", "/work/out/clip.mp4"]),
      act: async () => { await d.keyboard.press("Return"); await sleep(1200); await mouse.move(640, 500); } },
    { app: "DB Browser", label: "reading the database", match: "DB Browser|SQLite", wait: 45000,
      launch: () => d.open("sqlitebrowser", ["/work/out/lease.sqlite"]),
      act: async () => { await mouse.click(400, 300); await sleep(700); } },
    { app: "Dia", label: "a diagram", match: "Dia", wait: 40000,
      launch: () => d.open("dia"),
      act: async () => { await mouse.drag({ x: 480, y: 300 }, { x: 700, y: 430 }); await sleep(600); } },
    { app: "Baobab", label: "what fills the disk", match: "Disk Usage|Baobab", wait: 45000,
      launch: () => d.open("baobab"),
      act: async () => { await sleep(3000); await mouse.move(640, 420); } },
    { app: "System Monitor", label: "processes and load", match: "System Monitor", wait: 45000,
      launch: () => d.open("gnome-system-monitor"),
      act: async () => { await mouse.click(500, 120); await sleep(900); } },
    { app: "Task Manager", label: "the Xfce view", match: "Task Manager", wait: 35000,
      launch: () => d.open("xfce4-taskmanager"),
      act: async () => { await mouse.move(600, 350); await sleep(600); } },
    { app: "Disks", label: "the block device", match: "Disks", wait: 45000,
      launch: () => d.open("gnome-disks"),
      act: async () => { await mouse.move(600, 350); await sleep(700); } },
    { app: "Calculator", label: "arithmetic, clicked", match: "Calculator", wait: 35000,
      launch: () => d.open("gnome-calculator"),
      act: async () => { for (const [x, y] of [[560, 430], [700, 430], [560, 500]]) { await mouse.click(x, y); await sleep(350); } } },
    { app: "Galculator", label: "a second calculator", match: "galculator", wait: 30000,
      launch: () => d.open("galculator"),
      act: async () => { for (const [x, y] of [[150, 400], [220, 400]]) { await mouse.click(x, y); await sleep(350); } } },
    { app: "Character Map", label: "glyphs and fonts", match: "Character|gucharmap", wait: 35000,
      launch: () => d.open("gucharmap"),
      act: async () => { await mouse.move(500, 350); await sleep(600); } },
    { app: "Color Picker", label: "picking a colour", match: "Color|gcolor", wait: 30000,
      launch: () => d.open("gcolor3"),
      act: async () => { await mouse.move(500, 300); await sleep(600); } },
    { app: "PDF Arranger", label: "rearranging pages", match: "PDF Arranger", wait: 40000,
      launch: () => d.open("pdfarranger", ["/work/out/report.pdf"]),
      act: async () => { await mouse.move(600, 350); await sleep(600); } },
  ];

  let kept = 0;
  for (const it of APPS) {
    if (kept >= 30) break;
    await it.launch().catch((e) => log(`  ${it.app} launch:`, e.message.slice(0, 60)));
    const id = await waitWindow(it.match, it.wait);
    if (!id) { log(`  ${it.app}: no window`); continue; }
    await sleep(2200);
    const name = await present(id, it.match);
    if (!name) { log(`  ${it.app}: window never took the screen`); await X(`xdotool windowkill ${id}; true`).catch(() => {}); await sleep(800); continue; }
    // "thinking" — the app is up and the agent is about to act
    await beat(it.app, it.label, "thinking");
    await it.act().catch(() => {});
    await sleep(900);
    await beat(it.app, it.label, "acting");
    kept += 1;
    await sleep(900);
    await X(`xdotool windowkill ${id}; true`).catch(() => {});
    await sleep(1400);
  }
  log(`kept ${kept} applications`);

  const st = await d.record.stop().catch(() => null);
  log("finalized:", st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/raw.mp4`, Buffer.from(await r.arrayBuffer())); log("saved raw.mp4"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  writeFileSync(`${OUT}/cursor.json`, JSON.stringify(cursor, null, 1));
  console.table(beats.filter((b) => b.phase === "acting").map((b) => ({ app: b.app, at: b.at })));
} finally {
  await lease.terminate().catch(() => {});
}
log("done");
