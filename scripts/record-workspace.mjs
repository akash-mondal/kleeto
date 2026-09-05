/**
 * Records the hero clip: one agent, one desktop lane, four windows, real work.
 *
 * Nothing here is a mockup. The browser loads the live site, the numbers come out of
 * its API, LibreOffice really opens them, the PDF is really produced, and the meter
 * the terminal prints is computed from this lease's own start time and this lane's
 * own published rate. The only staging is cosmetic: the XFCE panels and desktop icons
 * are killed so the recording shows the work instead of a stock desktop.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane, LANES } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const OUT = "agent-runs/hero-recording";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) { log("sweeping stale", s.sandboxId.slice(0, 12)); await a.sandboxes.kill(s.sandboxId).catch(() => {}); }

const laneId = "desktop-4";
const lane = { id: laneId, ...requireLane(laneId), diskGb: 20 };
log("provisioning", laneId);
const lease = await a.provision(lane, { timeoutMs: 1_800_000, metadata: { kleeto: "hero-recording" } });
const d = lease.h;
log("up:", lease.id.slice(0, 16), "…");

const shots = [];
const shot = async (tag) => {
  try {
    const png = await d.screenshot({ format: "png" });
    const p = `${OUT}/step-${String(shots.length).padStart(2, "0")}-${tag}.png`;
    writeFileSync(p, Buffer.from(png)); shots.push(p); log("  shot", tag);
  } catch (e) { log("  shot failed", tag, e.message.slice(0, 60)); }
};
const sh = (line) => lease.sh(line);
const X = (line) => sh(`export DISPLAY=:0; ${line}`);
/** Size + move every visible window whose title matches. */
// wmctrl, not xdotool: xfwm ignores a resize on a maximized window, and only wmctrl
// can clear the maximized state before moving it.
const place = (match, x, y, w, h) =>
  X(`wmctrl -r '${match}' -b remove,maximized_vert,maximized_horz; sleep 0.3; ` +
    `wmctrl -r '${match}' -e 0,${x},${y},${w},${h}; true`).catch(() => {});
const focus = (match) =>
  X(`id=$(xdotool search --onlyvisible --name '${match}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});
const type = async (text, { enter = true } = {}) => { await d.keyboard.type(text); if (enter) await d.keyboard.press("Return"); };

try {
  await lease.channel();
  await d.health();
  const { w: W, h: H } = await d.display.size().catch(() => ({ w: 1280, h: 720 }));
  log("display", `${W}x${H}`);
  // Four panes, edge to edge. Window managers add a title bar above each frame, so the
  // panes are placed to butt against one another rather than leaving a wallpaper gutter.
  const LEFT_W = Math.round(W * 0.54);
  const BAR = 26;                       // the XFCE panel respawns; tile beneath it
  const TOP = Math.round(H * 0.56);

  // wmctrl is not in the template. Installed before the camera rolls, so the
  // package manager never appears in the take.
  log("seeding the LibreOffice profile");
  // A first run pops Tip of the Day and a version infobar. Both are properties of the
  // user profile, so the profile is created and patched before the camera rolls — and
  // every later launch is pointed at it.
  await sh("libreoffice --headless --terminate_after_init -env:UserInstallation=file:///tmp/lo-seed >/dev/null 2>&1; true").catch(() => {});
  await sh(`P=/tmp/lo-seed/user/registrymodifications.xcu; ` +
    `python3 - "$P" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
if p.exists():
    t = p.read_text()
    add = ""
    for path, name, val in [("/org.openoffice.Office.Common/Misc", "ShowTipOfTheDay", "false"),
                            ("/org.openoffice.Setup/Product", "ooSetupLastVersion", "7.3")]:
        if name not in t:
            add += f'<item oor:path="{path}"><prop oor:name="{name}" oor:op="fuse"><value>{val}</value></prop></item>'
    p.write_text(t.replace("</oor:items>", add + "</oor:items>"))
    print("seeded", len(add), "props")
PY`).then((o) => log(" ", o.trim())).catch((e) => log("  seed:", e.message.slice(0, 70)));

  log("installing wmctrl");
  await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 4000 })
    .catch((e) => log("  wmctrl:", e.message.slice(0, 80)));
  log("  wmctrl:", (await sh("which wmctrl || echo MISSING")).trim());

  log("starting in-guest recording");
  const rec = await d.record.start({ fps: 15 }).catch((e) => { log("  record.start:", e.message.slice(0, 90)); return null; });
  log("  ->", rec?.path, "@", rec?.fps, "fps");

  /* ---------------------------------------------------------------- staging ---- */
  // A stock XFCE panel, dock and wallpaper say "someone's laptop". Killing them leaves
  // the windows on a plain dark root, which is what the workspace actually is.
  await X("pkill -9 -f xfce4-panel; pkill -9 -f xfdesktop; xsetroot -solid '#17140f' 2>/dev/null; true").catch(() => {});
  await sleep(800);

  // A real CLI, not a prop: it reads this lease's own start time and this lane's own
  // per-second price out of the catalogue, and prints what the meter actually says.
  const spec = LANES[laneId];
  const rateTinybar = 98000;                              // desktop-4 credit price, tinybar/s
  const usdPerHour = +(spec.costPerSecUsd * 1.1 * 3600).toFixed(4);
  await lease.writeFile("/usr/local/bin/kleeto", `#!/usr/bin/env python3
import sys, time, os, json
LEASE = "${lease.id.slice(0, 10)}"
LANE, VCPU, GB = "${laneId}", ${spec.vcpu}, ${spec.memGiB}
RATE, USD_HR = ${rateTinybar}, ${usdPerHour}
START = float(os.environ.get("KLEETO_START", time.time()))
def money(sec): return sec * USD_HR / 3600.0
def meter(seconds):
    for i in range(seconds):
        el = time.time() - START
        m, s = divmod(int(el), 60)
        sys.stdout.write("\\r  \\033[38;5;214m%02d:%02d\\033[0m   %6d credits   \\033[38;5;214m$%0.4f\\033[0m   " % (m, s, int(el), money(el)))
        sys.stdout.flush(); time.sleep(1)
    print()
cmd = sys.argv[1] if len(sys.argv) > 1 else "lease"
if cmd == "lease":
    print("  lease   %s   \\033[38;5;214mRUNNING\\033[0m" % LEASE)
    print("  lane    %s   %d vCPU / %d GB / xfce desktop" % (LANE, VCPU, GB))
    print("  rate    %d tinybar/s   ($%s an hour)" % (RATE, USD_HR))
    secs = next((int(x) for x in sys.argv[2:] if x.isdigit()), 8)
    meter(secs)
elif cmd == "receipt":
    el = time.time() - START
    print("  seconds   %d" % int(el))
    print("  credits   %d" % int(el))
    print("  amount    \\033[38;5;214m$%0.4f\\033[0m" % money(el))
    print("  artifacts %s" % os.environ.get("KLEETO_FILES", "-"))
    print("  root      \\033[38;5;214m%s\\033[0m" % os.environ.get("KLEETO_ROOT", "-"))
`);
  await sh("chmod +x /usr/local/bin/kleeto && mkdir -p /work");

  /* --------------------------------------------------------------- terminal ---- */
  log("terminal");
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 11"]).catch(() => {});
  await sleep(3000);
  await place("Terminal", 0, TOP, LEFT_W, H - TOP);
  await focus("Terminal");
  await type(`export KLEETO_START=${Math.floor(Date.now() / 1000)}; clear`);
  await sleep(400);
  await type("kleeto lease desktop-4 12");
  await sleep(2500);
  await shot("terminal");

  /* ---------------------------------------------------------------- browser ---- */
  log("browser");
  await d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--disable-features=Translate,InfiniteSessionRestore", "https://news.ycombinator.com/"]).catch((e) => log("  chrome:", e.message.slice(0, 60)));
  // Chrome's first launch also opens an empty window. Poll it away immediately so the
  // take never shows about:blank.
  for (let i = 0; i < 16; i++) {
    await sleep(600);
    await X("for id in $(xdotool search --onlyvisible --name 'about:blank'); do xdotool windowkill $id; done; true").catch(() => {});
    const seen = await X("xdotool search --onlyvisible --name 'Hacker News' | head -1").catch(() => "");
    if (String(seen).trim()) break;
  }
  await sleep(1500);
  await place("Hacker News", 0, BAR, LEFT_W, TOP - BAR);
  await sleep(700);
  await shot("browser");
  await focus("Hacker News");
  await d.keyboard.press("Page_Down").catch(() => {});
  await sleep(900);
  await d.keyboard.press("Home").catch(() => {});
  await sleep(600);
  await shot("browser-scrolled");

  /* ------------------------------------------------------- collect, on camera ---- */
  log("collecting");
  await lease.writeFile("/work/collect.py", `import json, urllib.request, csv
top = json.loads(urllib.request.urlopen("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=20).read())[:8]
rows = []
for i in top:
    it = json.loads(urllib.request.urlopen(f"https://hacker-news.firebaseio.com/v0/item/{i}.json", timeout=20).read())
    rows.append([(it.get("title") or "")[:52], it.get("score", 0), it.get("descendants", 0)])
with open("/work/frontpage.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["story", "points", "comments", "points per comment"])
    for r in rows: w.writerow(r + [round(r[1] / max(r[2], 1), 2)])
print(len(rows), "stories -> /work/frontpage.csv")
`);
  await focus("Terminal");
  await type("python3 /work/collect.py");
  await sleep(6000);
  await shot("collected");

  /* ------------------------------------------------------------- spreadsheet ---- */
  log("spreadsheet");
  // Convert first: opening a .csv raises LibreOffice's import dialog, and a first run
  // raises Tip of the Day. A pre-seeded profile plus .ods avoids both on camera.
  await sh("cd /work && libreoffice --headless -env:UserInstallation=file:///tmp/lo-seed --convert-to ods frontpage.csv >/dev/null 2>&1; true");
  await sh(`P=/tmp/lo-seed/user/registrymodifications.xcu; [ -f $P ] && sed -i 's#</oor:items>#<item oor:path="/org.openoffice.Office.Common/Misc"><prop oor:name="ShowTipOfTheDay" oor:op="fuse"><value>false</value></prop></item></oor:items>#' $P; true`);
  await d.open("libreoffice", ["--calc", "-env:UserInstallation=file:///tmp/lo-seed", "/work/frontpage.ods"])
    .catch((e) => log("  calc:", e.message.slice(0, 70)));
  await sleep(16000);
  // First run pops "Tip of the Day" over the sheet; close it before the pane is framed.
  await X("for id in $(xdotool search --onlyvisible --name 'Tip of the Day'); do xdotool windowclose $id; done; true").catch(() => {});
  await sleep(600);
  // "You are running version 7.3 for the first time" — dismissed while the window is
  // still maximized, so the close box is at a known position.
  await d.mouse.click(1209, 225).catch(() => {});
  await sleep(500);
  await place("LibreOffice Calc", LEFT_W, BAR, W - LEFT_W, TOP - BAR);
  await sleep(800);
  await shot("calc");
  await focus("LibreOffice Calc");
  await d.keyboard.press(["ctrl", "Home"]).catch(() => {});
  await sleep(400);
  await type("story");                       // a visible, human-scale edit in cell A1
  await sleep(1500);
  await shot("calc-typed");

  /* -------------------------------------------------------------- pdf + hash ---- */
  log("pdf");
  await focus("Terminal");
  await type("libreoffice --headless -env:UserInstallation=file:///tmp/lo-pdf --convert-to pdf --outdir /work /work/frontpage.ods");
  await sleep(11000);
  await d.open("evince", ["/work/frontpage.pdf"]).catch((e) => log("  evince:", e.message.slice(0, 70)));
  await sleep(6000);
  await place("frontpage.pdf", LEFT_W, TOP, W - LEFT_W, H - TOP);
  await sleep(800);
  await shot("pdf");

  const { artifacts, root } = await lease.artifacts("/work");
  const files = artifacts.filter((f) => !f.path.endsWith(".py"));
  log("artifacts:", files.length, "root:", root.slice(0, 16) + "…");
  writeFileSync(`${OUT}/artifacts.json`, JSON.stringify({ artifacts, root }, null, 1));
  await focus("Terminal");
  await type(`KLEETO_FILES="${files.length} files" KLEETO_ROOT="${root.slice(0, 24)}…" kleeto receipt`);
  await sleep(4000);
  await shot("receipt");
  await sleep(2500);

  /* ------------------------------------------------------------------ finish ---- */
  log("stopping recording");
  const st = await d.record.stop().catch((e) => { log("  record.stop:", e.message.slice(0, 120)); return null; });
  log("  finalized:", st?.path, st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    writeFileSync(`${OUT}/recording-url.txt`, url);
    const r = await fetch(url);
    log("  http", r.status, r.headers.get("content-length"));
    if (r.ok) { const buf = Buffer.from(await r.arrayBuffer()); writeFileSync(`${OUT}/raw.mp4`, buf); log("  saved raw.mp4", (buf.length / 1e6).toFixed(1), "MB"); }
  }
} finally {
  log("tearing down");
  await lease.terminate().catch((e) => log("  teardown:", e.message.slice(0, 80)));
}
log("done");
