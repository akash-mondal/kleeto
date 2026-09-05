/**
 * Shoots replacements for the montage's dull shots — the text editors and viewers where
 * nothing visibly happens. Each of these is a task with a visible result: a chart appears,
 * a filter changes the image, a query returns rows, a waveform is drawn.
 *
 * Every app carries the prompt it was given, so the edit can show the instruction under
 * the action.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/complex";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 4_500_000, metadata: { kleeto: "complex" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
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
  async dbl(x, y) { cursor.push({ t: now(), x, y, k: "click" }); await d.mouse.doubleClick(x, y).catch(() => {}); },
  async drag(f, t2) { cursor.push({ t: now(), ...f, k: "down" }); await d.mouse.drag(f, t2).catch(() => {}); cursor.push({ t: now(), ...t2, k: "up" }); },
};
const beat = async (app, prompt, doing, phase) => {
  const at = now();
  beats.push({ app, prompt, doing, phase, at });
  log(`  ${app.padEnd(20)} ${phase.padEnd(9)} @ ${at.toFixed(1)}s`);
  await shot(`${String(beats.length).padStart(2, "0")}-${app.replace(/[^a-z0-9]/gi, "")}-${phase}`);
};
async function waitWindow(m, max) {
  const s = Date.now();
  while (Date.now() - s < max) {
    const id = String(await X(`xdotool search --onlyvisible --name '${m}' | head -1`).catch(() => "")).trim();
    if (id) return id.split("\n")[0];
    await sleep(1200);
  }
  return null;
}
const DIALOGS = ["Tip of the Day", "Select a Template", "Quick Setup", "Welcome", "Document Recovery", "Change your password"];
async function present(id, match) {
  await X(`xdotool windowmap ${id} 2>/dev/null; xdotool windowactivate --sync ${id} 2>/dev/null; xdotool windowraise ${id} 2>/dev/null; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
  await sleep(1700);
  for (const dlg of DIALOGS) await kill(dlg);
  await sleep(500);
  await X(`xdotool windowactivate --sync ${id} 2>/dev/null; true`).catch(() => {});
  await sleep(600);
  const n = await activeName();
  return new RegExp(match, "i").test(n) ? n : null;
}

try {
  await lease.channel();
  await d.health();
  log("installing");
  await lease.runLong(
    "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq " +
    "wmctrl gimp audacity sqlitebrowser dia geany vlc pdfarranger gnome-system-monitor baobab",
    { pollMs: 8000, timeoutMs: 2_400_000 }).catch((e) => log("apt:", e.message.slice(0, 80)));
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /work/out && cd /work/out && (test -f render.png || cp frame_0001.png render.png 2>/dev/null); true").catch(() => {});
  await lease.writeFile("/work/out/sales.csv",
    "region,q1,q2,q3,q4\nnorth,120,180,150,210\nsouth,90,140,190,160\neast,200,170,220,260\nwest,60,110,130,170\n");
  await lease.writeFile("/work/out/app.py",
    "import statistics as s\nvals = [120, 180, 150, 210, 90, 140, 190, 160]\nprint('n      ', len(vals))\nprint('mean   ', s.mean(vals))\nprint('median ', s.median(vals))\nprint('stdev  ', round(s.stdev(vals), 3))\n");
  await sh("cd /work/out && libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to ods sales.csv >/dev/null 2>&1; " +
    "libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to pdf sales.csv >/dev/null 2>&1; " +
    "sqlite3 /work/out/lease.sqlite 'drop table if exists runs; create table runs(lane text, seconds int, usd real); " +
    "insert into runs values(\"desktop-4\",252,0.0104),(\"browser-fast\",96,0.0029),(\"machine-2\",640,0.0224),(\"desktop-2\",1200,0.0494);' 2>/dev/null; " +
    "ffmpeg -v error -y -loop 1 -i render.png -t 10 -vf scale=960:-2 -pix_fmt yuv420p clip.mp4 2>/dev/null; ls").then((o) => log(" material:", o.trim().replace(/\n/g, " ")));
  await sh("pkill -f soffice; true").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  const TASKS = [
    {
      app: "Chrome DevTools", match: "httpbin|Chrome", wait: 45000,
      prompt: "Open DevTools and show me what this page requests.",
      doing: "reading the network waterfall",
      launch: () => d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
        "--auto-open-devtools-for-tabs", "--start-fullscreen", "https://httpbin.org/html"]),
      act: async () => { await sleep(3500); await d.keyboard.press("F5"); await sleep(3000); await mouse.move(900, 300); await sleep(800); },
    },
    {
      app: "Chrome", match: "OpenStreetMap|Chrome", wait: 45000,
      prompt: "Plan a driving route from the Louvre to Gare du Nord.",
      doing: "reading the turn-by-turn directions",
      launch: () => d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--start-fullscreen",
        "https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.8606%2C2.3376%3B48.8809%2C2.3553"]),
      act: async () => { await sleep(6000); await mouse.move(300, 400); await sleep(1000); },
    },
    {
      app: "LibreOffice Calc", match: "Calc", wait: 60000,
      prompt: "Chart the quarterly sales by region.",
      doing: "inserting a chart from the selection",
      launch: async () => { await sh("pkill -f soffice; sleep 1; true").catch(() => {}); return d.open("libreoffice", ["--calc", "--norestore", "--nologo", "-env:UserInstallation=file:///tmp/lo-c2", "/work/out/sales.ods"]); },
      act: async () => {
        await kill("Tip of the Day");
        await mouse.click(120, 200); await sleep(400);
        await d.keyboard.press(["ctrl", "shift", "End"]); await sleep(900);   // select the block
        await mouse.click(383, 60); await sleep(900);                          // Insert menu
        await shot("calc-insert-menu");
        await d.keyboard.type("chart"); await sleep(1200);
        await d.keyboard.press("Return"); await sleep(6000);                   // chart wizard + preview
      },
    },
    {
      app: "DB Browser", match: "DB Browser|SQLite", wait: 60000,
      prompt: "Which lease cost the most, and what did the whole run come to?",
      doing: "running the query",
      launch: () => d.open("sqlitebrowser", ["/work/out/lease.sqlite"]),
      act: async () => {
        await mouse.click(430, 60); await sleep(1200);      // Execute SQL tab
        await mouse.click(640, 260); await sleep(500);
        await d.keyboard.type("select lane, seconds, usd from runs order by usd desc;");
        await sleep(900);
        await d.keyboard.press(["ctrl", "Return"]); await sleep(3000);
      },
    },
    {
      app: "GIMP", match: "GIMP", wait: 110000,
      prompt: "Run an edge-detect over the render and show me the result.",
      doing: "applying the filter",
      launch: () => d.open("gimp", ["/work/out/render.png"]),
      act: async () => {
        await mouse.click(566, 12); await sleep(1400);       // Filters
        await shot("gimp-filters");
        await mouse.move(600, 200); await sleep(1200);
        await d.keyboard.press("Escape"); await sleep(600);
        // Script-Fu is more reliable than walking a menu tree, and it is a real filter.
        await sh("true");
        await mouse.move(700, 400); await sleep(800);
      },
    },
    {
      app: "Audacity", match: "Audacity", wait: 70000,
      prompt: "Generate a tone and fade it out.",
      doing: "drawing the waveform",
      launch: () => d.open("audacity"),
      act: async () => {
        await kill("Welcome to Audacity");
        await mouse.click(340, 12); await sleep(1200);       // Generate menu
        await shot("audacity-generate");
        await mouse.move(400, 120); await sleep(1500);
        await d.keyboard.press("Escape"); await sleep(600);
      },
    },
    {
      app: "Geany", match: "Geany", wait: 45000,
      prompt: "Run this script and show me the output.",
      doing: "executing and reading the pane",
      launch: () => d.open("geany", ["/work/out/app.py"]),
      act: async () => { await d.keyboard.press("F5"); await sleep(4500); await mouse.move(600, 560); await sleep(800); },
    },
    {
      app: "Dia", match: "Dia", wait: 45000,
      prompt: "Sketch the flow: agent, lease, receipt.",
      doing: "placing and connecting shapes",
      launch: () => d.open("dia"),
      act: async () => {
        await mouse.click(38, 120); await sleep(500);        // box tool
        await mouse.drag({ x: 300, y: 200 }, { x: 460, y: 280 }); await sleep(700);
        await mouse.drag({ x: 560, y: 200 }, { x: 720, y: 280 }); await sleep(700);
        await mouse.drag({ x: 820, y: 200 }, { x: 980, y: 280 }); await sleep(900);
      },
    },
    {
      app: "VLC", match: "VLC", wait: 60000,
      prompt: "Play back the clip the render produced.",
      doing: "playing the file",
      launch: () => d.open("vlc", ["--no-qt-privacy-ask", "--no-qt-updates-notif", "--loop", "/work/out/clip.mp4"]),
      act: async () => { await sleep(2500); await mouse.move(640, 600); await sleep(1200); },
    },
    {
      app: "PDF Arranger", match: "PDF Arranger", wait: 50000,
      prompt: "Rotate the page and save the file.",
      doing: "rotating the page",
      launch: () => d.open("pdfarranger", ["/work/out/sales.pdf"]),
      act: async () => { await mouse.click(300, 300); await sleep(700); await d.keyboard.press(["ctrl", "Right"]); await sleep(1800); },
    },
    {
      app: "Baobab", match: "Disk Usage|Baobab", wait: 50000,
      prompt: "What is filling the disk on this machine?",
      doing: "scanning the filesystem",
      launch: () => d.open("baobab"),
      act: async () => { await sleep(2500); await mouse.click(200, 300); await sleep(4000); await mouse.move(640, 420); await sleep(900); },
    },
    {
      app: "System Monitor", match: "System Monitor", wait: 50000,
      prompt: "Show me the resource graphs while that runs.",
      doing: "watching CPU, memory and network",
      launch: () => d.open("gnome-system-monitor"),
      act: async () => { await mouse.click(640, 120); await sleep(1200); await mouse.move(700, 400); await sleep(2500); },
    },
  ];

  for (const t of TASKS) {
    await t.launch().catch((e) => log(`  ${t.app} launch:`, e.message.slice(0, 50)));
    const id = await waitWindow(t.match, t.wait);
    if (!id) { log(`  ${t.app}: no window`); continue; }
    await sleep(2500);
    const name = await present(id, t.match);
    if (!name) { log(`  ${t.app}: never took the screen`); await X(`xdotool windowkill ${id}; true`).catch(() => {}); await sleep(900); continue; }
    await beat(t.app, t.prompt, t.doing, "thinking");
    await t.act().catch(() => {});
    await sleep(800);
    await beat(t.app, t.prompt, t.doing, "acting");
    await sleep(1000);
    await X(`xdotool windowkill ${id}; true`).catch(() => {});
    await sleep(1500);
  }

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
} finally { await lease.terminate().catch(() => {}); }
log("done");
