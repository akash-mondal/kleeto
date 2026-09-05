/**
 * Fourth pass: the five GUI applications that kept losing focus.
 *
 * Take C typed a document title into a leftover Chrome address bar, because the snapshot
 * boots with a Chrome window and `focus()` matched a window that was never raised. This
 * pass kills every stray window first, then verifies the active window really is the app
 * before touching the keyboard — and skips the beat instead of shooting the wrong screen.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/thirty-d";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "thirty-d" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
log("up:", lease.id.slice(0, 14));

const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const active = async () => String(await X("xdotool getactivewindow getwindowname 2>/dev/null || true").catch(() => "")).trim();
const raise = (m) => X(`wmctrl -a '${m}'; sleep 0.4; wmctrl -r '${m}' -b add,fullscreen; true`).catch(() => {});
const killAll = () => X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal|Quick Setup|Tip of the Day'); do xdotool windowkill $id; done; true").catch(() => {});
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };

let recStart = 0;
const beats = [];
const beat = async (app, note) => {
  const at = (Date.now() - recStart) / 1000;
  beats.push({ n: beats.length + 1, app, note, at: +at.toFixed(2) });
  log(`  ${String(beats.length).padStart(2)}. ${app.padEnd(20)} @ ${at.toFixed(1)}s  active="${await active()}"`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};
async function waitFor(match, max = 70000) {
  const started = Date.now();
  while (Date.now() - started < max) {
    if (String(await X(`xdotool search --onlyvisible --name '${match}' | head -1`).catch(() => "")).trim()) return true;
    await sleep(1500);
  }
  return false;
}
/** Raise the app and confirm it really has focus before typing into it. */
async function ownScreen(match, tries = 4) {
  for (let i = 0; i < tries; i++) {
    await raise(match);
    await sleep(1500);
    const name = await active();
    if (new RegExp(match.split("|")[0], "i").test(name)) return name;
  }
  return null;
}

try {
  await lease.channel();
  await d.health();
  if (!(await sh("which wmctrl || true")).trim()) {
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 5000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await killAll();
  await sleep(1500);
  log("windows now:", (await X("xdotool search --onlyvisible --name '.' getwindowname %@ | tr '\\n' '|'").catch(() => "")).slice(0, 160));

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  const APPS = [
    { app: "LibreOffice Writer", launch: () => d.open("libreoffice", ["--writer", "--norestore", "-env:UserInstallation=file:///tmp/lo-w2"]),
      match: "LibreOffice Writer", note: "a document, typed",
      act: async () => { await d.keyboard.type("Kleeto — lease report"); await sleep(900); await d.keyboard.press("Return"); await d.keyboard.type("Rendered, hashed and receipted on a rented desktop."); } },
    { app: "LibreOffice Impress", launch: () => d.open("libreoffice", ["--impress", "--norestore", "-env:UserInstallation=file:///tmp/lo-i2"]),
      match: "Impress", note: "slides",
      act: async () => { await kill("Select a Template"); await sleep(1200); await d.keyboard.type("Rented by the second"); } },
    { app: "LibreOffice Draw", launch: () => d.open("libreoffice", ["--draw", "--norestore", "-env:UserInstallation=file:///tmp/lo-d2"]),
      match: "LibreOffice Draw", note: "vector shapes",
      act: async () => { await d.mouse.drag({ x: 470, y: 300 }, { x: 800, y: 520 }); await sleep(800); } },
    { app: "Inkscape", launch: () => d.process.start("inkscape"),
      match: "Inkscape", note: "vector editing",
      act: async () => {
        // Quick Setup steals the first launch; Enter accepts it, then the star tool draws.
        await d.keyboard.press("Return").catch(() => {});
        await sleep(1500);
        await kill("Quick Setup");
        await sleep(1200);
        await ownScreen("Inkscape");
        await d.keyboard.press("s").catch(() => {});
        await d.mouse.drag({ x: 520, y: 330 }, { x: 800, y: 540 });
        await sleep(1200);
      } },
    { app: "Blender", launch: () => d.process.start("blender /work/out/scene.blend"),
      match: "Blender", note: "3D, driven by hand",
      act: async () => {
        await d.keyboard.press("Escape").catch(() => {});
        await sleep(900);
        for (const dx of [70, 140]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 355 }, "middle"); await sleep(500); }
        await d.keyboard.press("KP_0").catch(() => {});
        await sleep(1600);
      } },
  ];

  for (const it of APPS) {
    await it.launch().catch((e) => log("  launch:", e.message.slice(0, 60)));
    const appeared = await waitFor(it.match, 75000);
    if (!appeared) { log(`  ${it.app}: never appeared, skipping`); continue; }
    await sleep(3000);
    await kill("Tip of the Day");
    const owned = await ownScreen(it.match);
    log(`  ${it.app}: focus =`, owned ?? "NOT FOCUSED");
    if (!owned) { await kill(it.match); await sleep(1200); continue; }
    await it.act().catch(() => {});
    await sleep(1200);
    await beat(it.app, it.note);
    await sleep(1500);
    await kill(it.match);
    await sleep(2000);
  }

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
