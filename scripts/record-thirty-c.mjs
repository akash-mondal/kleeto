/**
 * Third pass: the last six applications.
 *
 * What went wrong in take B: LibreOffice on a brand-new profile needs about half a minute
 * before it draws a window, and seventeen seconds was not enough; Inkscape's Quick Setup
 * ignores the seeded preference, so it is dismissed by clicking Save; Blender needed the
 * previous window gone first; and Node was simply not installed.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/thirty-c";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "thirty-c" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
log("up:", lease.id.slice(0, 14));

const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const full = (m) => X(`wmctrl -r '${m}' -b add,fullscreen; true`).catch(() => {});
const focus = (m) => X(`id=$(xdotool search --onlyvisible --name '${m}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const names = () => X("xdotool search --onlyvisible --name '.' getwindowname %@ 2>/dev/null | tr '\\n' '|'").catch(() => "");
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };

let recStart = 0;
const beats = [];
const beat = async (app, note) => {
  const at = (Date.now() - recStart) / 1000;
  beats.push({ n: beats.length + 1, app, note, at: +at.toFixed(2) });
  log(`  ${String(beats.length).padStart(2)}. ${app.padEnd(20)} @ ${at.toFixed(1)}s   [${(await names()).slice(0, 110)}]`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};

/** Wait until a window with this title exists, up to `max` ms. */
async function waitFor(match, max = 45000) {
  const started = Date.now();
  while (Date.now() - started < max) {
    if (String(await X(`xdotool search --onlyvisible --name '${match}' | head -1`).catch(() => "")).trim()) return true;
    await sleep(1200);
  }
  return false;
}

try {
  await lease.channel();
  await d.health();
  log("installing wmctrl + nodejs");
  await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl nodejs",
    { pollMs: 6000, timeoutMs: 900_000 }).catch((e) => log("  apt:", e.message.slice(0, 70)));
  log("  node:", (await sh("node --version || echo MISSING")).trim());
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await sh("mkdir -p /work/out; cd /work/out && (test -f render.png || cp frame_0001.png render.png 2>/dev/null); true").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  // ---- node, in a terminal
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
  await sleep(3500); await full("Terminal"); await sleep(900); await focus("Terminal");
  await d.keyboard.type("clear\n"); await sleep(400);
  await d.keyboard.type("node -e \"const c=require('crypto');console.log('node', process.version);console.log('sha256', c.createHash('sha256').update('kleeto').digest('hex'))\"\n");
  await sleep(3200);
  await beat("node", "JavaScript, same box");
  await sleep(1000);
  await kill("Terminal"); await sleep(1200);

  // ---- the three LibreOffice apps, each on its own profile, each given time to appear
  for (const [flag, match, label, act] of [
    ["--writer", "LibreOffice Writer", "a document, typed", async () => { await d.keyboard.type("Kleeto — lease report"); }],
    ["--impress", "Impress", "slides", async () => { await kill("Select a Template"); await sleep(900); await d.keyboard.type("Rented by the second"); }],
    ["--draw", "LibreOffice Draw", "vector shapes", async () => { await d.mouse.drag({ x: 470, y: 300 }, { x: 800, y: 520 }).catch(() => {}); }],
  ]) {
    const prof = `/tmp/lo${flag.replace(/-/g, "")}`;
    await d.open("libreoffice", [flag, "--norestore", `-env:UserInstallation=file://${prof}`]).catch((e) => log("  lo:", e.message.slice(0, 60)));
    const ok = await waitFor(match, 60000);
    log(`  ${match} appeared:`, ok);
    await sleep(2500);
    await kill("Tip of the Day");
    await full(match); await sleep(1200); await focus(match);
    await act().catch(() => {});
    await sleep(1500);
    await beat(match, label);
    await sleep(1200);
    await kill(match); await sleep(1500);
  }

  // ---- Inkscape: the Quick Setup wizard is dismissed by its Save button
  await d.process.start("inkscape").catch(() => {});
  await waitFor("Inkscape", 50000);
  await sleep(4000);
  await d.mouse.click(1227, 401).catch(() => {});     // "Save" on the Quick Setup panel
  await sleep(2500);
  await kill("Quick Setup");
  await sleep(1200);
  await full("Inkscape"); await sleep(1200); await focus("Inkscape");
  await d.keyboard.press("s").catch(() => {});         // star tool
  await d.mouse.drag({ x: 520, y: 330 }, { x: 800, y: 540 }).catch(() => {});
  await sleep(2000);
  await beat("Inkscape", "vector editing");
  await sleep(1200);
  await kill("Inkscape"); await sleep(1500);

  // ---- Blender, with the screen to itself
  await d.process.start("blender /work/out/scene.blend").catch(() => {});
  const bok = await waitFor("Blender", 60000);
  log("  Blender appeared:", bok);
  await sleep(6000);
  await full("Blender"); await sleep(1500); await focus("Blender");
  await d.keyboard.press("Escape").catch(() => {});
  await sleep(1000);
  for (const dx of [70, 140]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 355 }, "middle").catch(() => {}); await sleep(500); }
  await d.keyboard.press("KP_0").catch(() => {});
  await sleep(2000);
  await beat("Blender", "3D, driven by hand");
  await sleep(2000);

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
  await lease.terminate().catch(() => {});
}
log("done");
