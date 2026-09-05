/**
 * Shoots the footage for the 60-second hero film: one continuous take on one lease,
 * covering browser research, headless compute, desktop applications, publishing and the
 * receipt. Beat boundaries are written to beats.json so the edit can cut precisely
 * instead of hunting through the take by eye.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const OUT = "agent-runs/film";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARM = "snap_dl6qfkqsxrrh";                 // Blender + Inkscape already installed

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) { log("sweeping", s.sandboxId.slice(0, 12)); await a.sandboxes.kill(s.sandboxId).catch(() => {}); }

const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 2_400_000, metadata: { kleeto: "hero-film" }, fromSnapshot: WARM });
const d = lease.h;
log("up:", lease.id.slice(0, 14), "…");

const sh = (line) => lease.sh(line);
const X = (line) => sh(`export DISPLAY=:0; ${line}`);
const place = (m, x, y, w, h) => X(`wmctrl -r '${m}' -b remove,maximized_vert,maximized_horz; sleep 0.3; wmctrl -r '${m}' -e 0,${x},${y},${w},${h}; true`).catch(() => {});
const full = (m) => X(`wmctrl -r '${m}' -b add,fullscreen; true`).catch(() => {});
const focus = (m) => X(`id=$(xdotool search --onlyvisible --name '${m}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const type = async (t, enter = true) => { await d.keyboard.type(t); if (enter) await d.keyboard.press("Return"); };
const shot = async (tag) => { try { writeFileSync(`${OUT}/${tag}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };

/** Beat log: seconds from the start of the recording, so the edit can cut by number. */
let recStart = 0;
const beats = [];
const beat = (name, note = "") => {
  const at = (Date.now() - recStart) / 1000;
  beats.push({ name, at: +at.toFixed(2), note });
  log(`  beat ${name} @ ${at.toFixed(1)}s`);
};

try {
  await lease.channel();
  await d.health();
  const { w: W, h: H } = await d.display.size().catch(() => ({ w: 1280, h: 720 }));
  log("display", `${W}x${H}`);
  if (!(await sh("which wmctrl || true")).trim()) {
    log("installing wmctrl");
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 4000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await sh("mkdir -p /work/out");

  // Everything that would be dead air on camera is prepared before the recorder starts:
  // the collector script, the plotting script and the LibreOffice profile.
  await lease.writeFile("/work/collect.py", `import json, urllib.request, csv
top = json.loads(urllib.request.urlopen("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=20).read())[:10]
rows = []
for i in top:
    it = json.loads(urllib.request.urlopen(f"https://hacker-news.firebaseio.com/v0/item/{i}.json", timeout=20).read())
    rows.append([(it.get("title") or "")[:46], it.get("score", 0), it.get("descendants", 0)])
with open("/work/out/frontpage.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["story", "points", "comments"])
    for r in rows: w.writerow(r)
print(len(rows), "stories collected")
`);
  await lease.writeFile("/work/plot.py", `import csv, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
rows = list(csv.DictReader(open("/work/out/frontpage.csv")))[:8]
names = [r["story"][:22] for r in rows][::-1]
vals = [int(r["points"]) for r in rows][::-1]
fig, ax = plt.subplots(figsize=(9, 5), dpi=110)
fig.patch.set_facecolor("#171310"); ax.set_facecolor("#171310")
ax.barh(names, vals, color="#f5b301")
ax.tick_params(colors="#d8d2c8", labelsize=8)
for sp in ax.spines.values(): sp.set_color("#3a332c")
ax.set_title("front page by points", color="#f2ece2", loc="left")
fig.tight_layout(); fig.savefig("/work/out/chart.png")
print("chart written")
`);
  await sh("pip install matplotlib -q 2>/dev/null || python3 -m pip install matplotlib -q 2>/dev/null; python3 -c 'import matplotlib; print(\"matplotlib\", matplotlib.__version__)'").then((o) => log(" ", o.trim())).catch((e) => log("  matplotlib:", e.message.slice(0, 60)));
  await sh("libreoffice --headless --terminate_after_init -env:UserInstallation=file:///tmp/lo-seed >/dev/null 2>&1; true").catch(() => {});
  await sh(`P=/tmp/lo-seed/user/registrymodifications.xcu; python3 - "$P" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
if p.exists():
    t = p.read_text(); add = ""
    for path, name, val in [("/org.openoffice.Office.Common/Misc", "ShowTipOfTheDay", "false"),
                            ("/org.openoffice.Setup/Product", "ooSetupLastVersion", "7.3")]:
        if name not in t:
            add += f'<item oor:path="{path}"><prop oor:name="{name}" oor:op="fuse"><value>{val}</value></prop></item>'
    p.write_text(t.replace("</oor:items>", add + "</oor:items>"))
PY`).catch(() => {});

  /* ================================================================ recording ==== */
  const rec = await d.record.start({ fps: 15 }).catch((e) => { log("record.start:", e.message.slice(0, 80)); return null; });
  recStart = Date.now();
  log("recording ->", rec?.path);

  // ---- 1. browser: research on a live site
  beat("browser-open", "Chrome launching on the live front page");
  await d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--start-fullscreen", "https://news.ycombinator.com/"]).catch(() => {});
  for (let i = 0; i < 20; i++) {
    await sleep(700);
    await kill("about:blank");
    if (String(await X("xdotool search --onlyvisible --name 'Hacker News' | head -1").catch(() => "")).trim()) break;
  }
  await sleep(4000);
  await full("Hacker News");
  await sleep(1500);
  beat("browser-read", "scrolling the front page");
  await focus("Hacker News");
  await d.keyboard.press("Page_Down").catch(() => {});
  await sleep(1800);
  await d.keyboard.press("Home").catch(() => {});
  await sleep(1500);
  await shot("01-browser");

  // ---- 2. terminal: pull the same data through the API
  beat("terminal-collect", "the same data, through the API");
  await kill("Hacker News");
  await sleep(1200);
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
  await sleep(3500);
  await full("Terminal");
  await sleep(1000);
  await focus("Terminal");
  await type("clear");
  await sleep(500);
  await type("python3 /work/collect.py && head -4 /work/out/frontpage.csv");
  await sleep(9000);
  await shot("02-collect");

  // ---- 3. REPL: chart it
  beat("terminal-plot", "matplotlib chart from the CSV");
  await type("python3 /work/plot.py");
  await sleep(7000);
  await shot("03-plot");

  // ---- 4. headless render
  beat("terminal-render", "Blender rendering with no display");
  await type("blender -b /work/out/scene.blend -o /work/out/frame_ -f 1");
  await sleep(13000);
  await shot("04-render");

  // ---- 5. serve it, then open the preview URL in the browser
  beat("terminal-serve", "a web server on the machine");
  await type("cd /work/out && python3 -m http.server 8080 >/dev/null 2>&1 &");
  await sleep(2500);
  const preview = lease.previewUrl(8080);
  log("  preview:", String(preview).slice(0, 80));
  await type(`echo "${String(preview)}"`);
  await sleep(2500);
  beat("browser-preview", "the same machine, seen from the public internet");
  await d.open("google-chrome", ["--no-sandbox", "--test-type", "--start-fullscreen", String(preview)]).catch(() => {});
  await sleep(9000);
  await full("index of");
  await sleep(1200);
  await shot("05-preview");

  // ---- 6. desktop: Blender in the GUI
  beat("desktop-blender", "the same scene, opened in Blender");
  await kill("index of");
  await sleep(1200);
  await d.process.start("blender /work/out/scene.blend").catch(() => {});
  await sleep(22000);
  await full("Blender");
  await sleep(2000);
  await focus("Blender");
  await d.keyboard.press("Escape").catch(() => {});
  await sleep(1200);
  for (const dx of [50, 100, 150]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 360 }, "middle").catch(() => {}); await sleep(450); }
  await d.keyboard.press("KP_0").catch(() => {});
  await sleep(2500);
  await shot("06-blender");
  beat("desktop-render", "F12");
  await d.keyboard.press("F12").catch(() => {});
  await sleep(15000);
  await shot("07-blender-render");
  await sleep(2500);

  // ---- 7. desktop: the spreadsheet
  beat("desktop-calc", "the numbers in a spreadsheet");
  await kill("Blender");
  await sleep(1500);
  await sh("cd /work/out && libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to ods frontpage.csv >/dev/null 2>&1; true").catch(() => {});
  await d.open("libreoffice", ["--calc", "-env:UserInstallation=file:///tmp/lo-seed", "/work/out/frontpage.ods"]).catch(() => {});
  await sleep(16000);
  await kill("Tip of the Day");
  await full("LibreOffice Calc");
  await sleep(1500);
  await focus("LibreOffice Calc");
  await d.keyboard.press(["ctrl", "Home"]).catch(() => {});
  await sleep(600);
  await type("story");
  await sleep(2000);
  await shot("08-calc");

  // ---- 8. the receipt
  beat("receipt", "what came out, and what it cost");
  await kill("LibreOffice Calc");
  await sleep(1500);
  await focus("Terminal");
  await type("clear");
  await sleep(400);
  await type("ls -la /work/out | tail -6");
  await sleep(3500);
  const { artifacts, root } = await lease.artifacts("/work/out");
  writeFileSync(`${OUT}/artifacts.json`, JSON.stringify({ artifacts, root }, null, 1));
  log("  artifacts:", artifacts.length, "root:", root.slice(0, 16) + "…");
  await type("sha256sum /work/out/*.png /work/out/*.csv | head -4");
  await sleep(5000);
  await shot("09-receipt");
  beat("end");
  await sleep(2000);

  const st = await d.record.stop().catch((e) => { log("record.stop:", e.message.slice(0, 80)); return null; });
  log("finalized:", st?.path, st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { const buf = Buffer.from(await r.arrayBuffer()); writeFileSync(`${OUT}/raw.mp4`, buf); log("saved raw.mp4", (buf.length / 1e6).toFixed(1), "MB"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify({ beats, preview: String(preview) }, null, 1));
  console.table(beats);
} finally {
  log("tearing down");
  await lease.terminate().catch(() => {});
}
log("done");
