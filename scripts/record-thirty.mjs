/**
 * Shoots the montage: thirty different applications on one lease, each doing one real
 * thing. Beat timestamps go to beats.json so each shot can be cut to two seconds.
 *
 * Nothing is repeated from the product-card loops: different apps, different tasks.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const OUT = "agent-runs/thirty";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) { log("sweeping", s.sandboxId.slice(0, 12)); await a.sandboxes.kill(s.sandboxId).catch(() => {}); }
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "thirty" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
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
/** Mark the moment a shot becomes worth watching. */
const beat = async (app, note) => {
  const at = (Date.now() - recStart) / 1000;
  beats.push({ n: beats.length + 1, app, note, at: +at.toFixed(2) });
  log(`  ${String(beats.length).padStart(2)}. ${app.padEnd(16)} @ ${at.toFixed(1)}s`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};

/** One GUI beat: launch, wait, fill the screen, act, mark, close. */
async function gui(app, launch, { wait = 6000, act = async () => {}, match, note }) {
  await launch();
  await sleep(wait);
  if (match) { await full(match); await sleep(900); await focus(match); }
  await act();
  await beat(app, note);
  await sleep(1600);
  if (match) { await kill(match); await sleep(900); }
}

/** One terminal beat: type a command into the always-open shell. */
async function term(app, cmd, { wait = 3200, note, clear = true } = {}) {
  await focus("Terminal");
  if (clear) { await type("clear"); await sleep(350); }
  await type(cmd);
  await sleep(wait);
  await beat(app, note);
  await sleep(900);
}

try {
  await lease.channel();
  await d.health();
  log("display", JSON.stringify(await d.display.size().catch(() => ({}))));

  log("installing the rest of the toolbox (before the camera rolls)");
  await lease.runLong(
    "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq " +
    "wmctrl htop tree neofetch ncdu jq sqlite3 ffmpeg git tmux vim gimp figlet cowsay bat",
    { pollMs: 6000, timeoutMs: 1_500_000 }
  ).catch((e) => log("  apt:", e.message.slice(0, 90)));
  log("  have:", (await sh("for b in htop tree neofetch ncdu jq sqlite3 ffmpeg git tmux vim gimp figlet blender inkscape; do command -v $b >/dev/null && printf '%s ' $b; done")).trim());

  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await sh("mkdir -p /work/out /work/repo");
  // Material the apps will open, prepared off camera.
  await sh(`cd /work/out && printf 'story,points\\nOCaml,70\\nBlender,204\\nHedera,157\\n' > data.csv && ` +
    `libreoffice --headless -env:UserInstallation=file:///tmp/lo-seed --convert-to ods data.csv >/dev/null 2>&1; ` +
    `libreoffice --headless -env:UserInstallation=file:///tmp/lo-seed --convert-to pdf data.csv >/dev/null 2>&1; true`).catch(() => {});
  await sh(`P=/tmp/lo-seed/user/registrymodifications.xcu; python3 - "$P" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
if p.exists():
    t = p.read_text(); add = ""
    for path, name, val in [("/org.openoffice.Office.Common/Misc", "ShowTipOfTheDay", "false"),
                            ("/org.openoffice.Setup/Product", "ooSetupLastVersion", "7.3")]:
        if name not in t: add += f'<item oor:path="{path}"><prop oor:name="{name}" oor:op="fuse"><value>{val}</value></prop></item>'
    p.write_text(t.replace("</oor:items>", add + "</oor:items>"))
PY`).catch(() => {});
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});
  await sh("test -f /work/out/render.png || cp /work/out/frame_0001.png /work/out/render.png 2>/dev/null; true").catch(() => {});

  /* ================================================================ recording ==== */
  const rec = await d.record.start({ fps: 15 }).catch((e) => { log("record.start:", e.message.slice(0, 70)); return null; });
  recStart = Date.now();
  log("recording ->", rec?.path);

  // A terminal stays open all film; the CLI beats run inside it.
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
  await sleep(3500);
  await full("Terminal");
  await sleep(1000);

  /* ------------------------------------------------------------- shell tools ---- */
  await term("neofetch", "neofetch", { note: "the machine introduces itself" });
  await term("htop", "htop -d 5 & sleep 3; kill %1", { wait: 3600, note: "what is running on it" });
  await term("tree", "tree -L 2 /work", { note: "the working directory" });
  await term("curl + jq", "curl -s https://api.github.com/repos/torvalds/linux | jq '{name, stars: .stargazers_count, forks}'", { wait: 4200, note: "a live API, parsed" });
  await term("python", "python3 -c \"import statistics as s; xs=[70,204,157,26,712]; print('mean', s.mean(xs)); print('stdev', round(s.stdev(xs),2))\"", { note: "arithmetic in the REPL" });
  await term("sqlite3", "sqlite3 /work/out/db.sqlite 'create table if not exists t(k text, v int); insert into t values(\"blender\",204),(\"ocaml\",70); select * from t;'", { wait: 3400, note: "a database, created and queried" });
  await term("git", "git clone -q --depth 1 https://github.com/hyperledger/hiero-sdk-js /work/repo/sdk 2>/dev/null; git -C /work/repo/sdk log --oneline -5", { wait: 8000, note: "a repository, cloned" });
  await term("node", "node -e \"console.log('sha', require(\\\"crypto\\\").createHash('sha256').update('kleeto').digest('hex').slice(0,32))\"", { note: "JavaScript on the same box" });
  await term("ffmpeg", "ffmpeg -v error -y -loop 1 -i /work/out/render.png -t 2 -vf scale=640:-2 -pix_fmt yuv420p /work/out/clip.mp4 && ls -la /work/out/clip.mp4", { wait: 5000, note: "encoding video" });
  await term("blender (cli)", "blender -b /work/out/scene.blend -o /work/out/f_ -f 2 2>&1 | tail -6", { wait: 9000, note: "a render with no display" });
  await term("sha256sum", "sha256sum /work/out/*.png | head -3", { note: "hashing what it made" });
  await term("ncdu", "ncdu -x --exclude /proc /work -o /work/out/du.json >/dev/null 2>&1 && du -sh /work/*", { note: "where the disk went" });
  await term("tmux", "tmux new-session -d -s k 'top -b -d1' \; split-window -d 'tail -f /var/log/dpkg.log' \; list-panes; tmux kill-server", { wait: 3000, note: "panes, sessions, the works" });
  await term("vim", "vim -c 'set number' -c 'normal ggO# kleeto notes' -c 'wq' /work/out/notes.md; cat /work/out/notes.md", { wait: 3000, note: "an editor with no mouse" });
  await term("http.server", "cd /work/out && (python3 -m http.server 8099 >/dev/null 2>&1 &) ; sleep 1; curl -s localhost:8099 | head -6", { wait: 3400, note: "a server, answering" });
  await term("figlet", "figlet -w 110 KLEETO && uptime", { note: "because the terminal is real" });

  /* ---------------------------------------------------------------- GUI apps ---- */
  await kill("Terminal");
  await sleep(1200);

  await gui("Chrome", () => d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--start-fullscreen", "https://en.wikipedia.org/wiki/Blender_(software)"]).catch(() => {}),
    { wait: 11000, match: "Wikipedia", note: "reading a page", act: async () => { await d.keyboard.press("Page_Down").catch(() => {}); await sleep(1200); } });

  await gui("Chrome (maps)", () => d.open("google-chrome", ["--no-sandbox", "--test-type", "--start-fullscreen", "https://www.openstreetmap.org/#map=15/40.7484/-73.9857"]).catch(() => {}),
    { wait: 11000, match: "OpenStreetMap", note: "a map, panned", act: async () => { await d.mouse.drag({ x: 800, y: 420 }, { x: 600, y: 320 }).catch(() => {}); await sleep(1500); } });

  await gui("LibreOffice Calc", () => d.open("libreoffice", ["--calc", "-env:UserInstallation=file:///tmp/lo-seed", "/work/out/data.ods"]).catch(() => {}),
    { wait: 16000, match: "LibreOffice Calc", note: "a spreadsheet", act: async () => { await kill("Tip of the Day"); await d.keyboard.press(["ctrl", "Home"]).catch(() => {}); await sleep(400); await type("story"); await sleep(900); } });

  await gui("LibreOffice Writer", () => d.open("libreoffice", ["--writer", "-env:UserInstallation=file:///tmp/lo-seed"]).catch(() => {}),
    { wait: 14000, match: "LibreOffice Writer", note: "a document, typed", act: async () => { await kill("Tip of the Day"); await type("Kleeto — lease report", false); await sleep(1200); } });

  await gui("LibreOffice Impress", () => d.open("libreoffice", ["--impress", "-env:UserInstallation=file:///tmp/lo-seed"]).catch(() => {}),
    { wait: 15000, match: "Impress", note: "slides", act: async () => { await kill("Tip of the Day"); await kill("Select a Template"); await sleep(800); } });

  await gui("LibreOffice Draw", () => d.open("libreoffice", ["--draw", "-env:UserInstallation=file:///tmp/lo-seed"]).catch(() => {}),
    { wait: 14000, match: "LibreOffice Draw", note: "vector shapes", act: async () => { await kill("Tip of the Day"); await d.mouse.drag({ x: 500, y: 300 }, { x: 760, y: 470 }).catch(() => {}); await sleep(900); } });

  await gui("Evince", () => d.open("evince", ["/work/out/data.pdf"]).catch(() => {}),
    { wait: 7000, match: "data.pdf", note: "a PDF it produced" });

  await gui("Thunar", () => d.open("thunar", ["/work/out"]).catch(() => {}),
    { wait: 6000, match: "out", note: "files on disk" });

  await gui("Mousepad", () => d.open("mousepad", ["/work/out/notes.md"]).catch(() => {}),
    { wait: 5000, match: "notes.md", note: "a text editor", act: async () => { await type("  — written on a rented machine", false); await sleep(1000); } });

  await gui("Ristretto", () => d.open("ristretto", ["/work/out/render.png"]).catch(() => {}),
    { wait: 6000, match: "render.png", note: "the render, viewed" });

  await gui("Galculator", () => d.open("galculator").catch(() => {}),
    { wait: 5000, match: "galculator", note: "a calculator, clicked", act: async () => { for (const [x, y] of [[150, 400], [220, 400], [150, 460]]) { await d.mouse.click(x, y).catch(() => {}); await sleep(400); } } });

  await gui("Xarchiver", () => d.open("xarchiver", ["/work/out/du.json"]).catch(() => {}),
    { wait: 6000, match: "Xarchiver", note: "archives" });

  await gui("GIMP", () => d.process.start("gimp -s /work/out/render.png").catch(() => d.open("gimp", ["/work/out/render.png"])),
    { wait: 26000, match: "GNU Image", note: "image editing" });

  await gui("Inkscape", () => d.process.start("inkscape").catch(() => d.open("inkscape")),
    { wait: 18000, match: "Inkscape", note: "vector editing", act: async () => { await d.mouse.drag({ x: 520, y: 320 }, { x: 780, y: 500 }).catch(() => {}); await sleep(900); } });

  await gui("Blender", () => d.process.start("blender /work/out/scene.blend").catch(() => {}),
    { wait: 24000, match: "Blender", note: "3D, driven by hand",
      act: async () => { await d.keyboard.press("Escape").catch(() => {}); await sleep(800);
        for (const dx of [60, 120]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 355 }, "middle").catch(() => {}); await sleep(450); }
        await d.keyboard.press("KP_0").catch(() => {}); await sleep(1500); } });

  await beat("wrap", "end of take");
  await sleep(1500);

  const st = await d.record.stop().catch((e) => { log("record.stop:", e.message.slice(0, 70)); return null; });
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
