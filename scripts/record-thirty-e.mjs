/**
 * Fifth pass: the last four applications, shot so nothing depends on keyboard focus.
 *
 * The LibreOffice beats kept failing because the window never took focus and the typing
 * went elsewhere. This pass opens documents that already have content, so the shot is
 * correct whether or not focus lands. Blender is launched through `open(name, args)` —
 * `process.start("blender /path")` tried to exec a binary with a space in its name.
 * Six candidates run; the first four that actually appear are the ones used.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/thirty-e";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "thirty-e" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
log("up:", lease.id.slice(0, 14));

const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };
const active = async () => String(await X("xdotool getactivewindow getwindowname 2>/dev/null || true").catch(() => "")).trim();

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
    const id = String(await X(`xdotool search --onlyvisible --name '${match}' | head -1`).catch(() => "")).trim();
    if (id) return id;
    await sleep(1500);
  }
  return null;
}
/** Raise by window id, fill the screen, and click inside so the app owns the pointer. */
async function present(id) {
  await X(`xdotool windowactivate --sync ${id}; xdotool windowraise ${id}; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
  await sleep(1800);
  await d.mouse.click(640, 400).catch(() => {});
  await sleep(700);
}

try {
  await lease.channel();
  await d.health();
  if (!(await sh("which wmctrl || true")).trim()) {
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl xfce4-taskmanager ncdu nano", { pollMs: 5000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});

  // Documents with content already in them, so the shot does not depend on typing.
  log("preparing documents");
  await lease.writeFile("/work/out/report.txt",
    "Kleeto — lease report\n\nRendered, hashed and receipted on a rented desktop.\n\n" +
    "lane        desktop-4\nseconds     252\namount      $0.0104\nfiles out   7\n");
  await lease.writeFile("/work/out/drawing.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
  <rect width="800" height="520" fill="#ffffff"/>
  <circle cx="250" cy="250" r="140" fill="#f5b301"/>
  <rect x="380" y="140" width="300" height="220" rx="24" fill="#17140f"/>
  <text x="60" y="470" font-family="sans-serif" font-size="40" fill="#17140f">rented by the second</text>
</svg>`);
  await sh("cd /work/out && libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to odt report.txt >/dev/null 2>&1; " +
           "libreoffice --headless -env:UserInstallation=file:///tmp/lo-conv --convert-to odg drawing.svg >/dev/null 2>&1; ls -la /work/out | tail -8").then((o) => log(o.trim().split("\n").slice(-4).join(" | ")));

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  const CANDIDATES = [
    { app: "LibreOffice Writer", note: "a document, already written",
      launch: () => d.open("libreoffice", ["--writer", "--norestore", "-env:UserInstallation=file:///tmp/lo-w3", "/work/out/report.odt"]),
      match: "report.odt", after: async () => { await d.keyboard.press("ctrl+End").catch(() => {}); } },
    { app: "Blender", note: "3D, driven by hand",
      launch: () => d.open("blender", ["/work/out/scene.blend"]),
      match: "Blender", wait: 75000,
      after: async () => {
        await d.keyboard.press("Escape").catch(() => {});
        await sleep(800);
        for (const dx of [70, 140]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 355 }, "middle").catch(() => {}); await sleep(500); }
        await d.keyboard.press("KP_0").catch(() => {});
        await sleep(1500);
      } },
    { app: "LibreOffice Draw", note: "vector shapes",
      launch: () => d.open("libreoffice", ["--draw", "--norestore", "-env:UserInstallation=file:///tmp/lo-d3", "/work/out/drawing.odg"]),
      match: "drawing.odg" },
    { app: "xfce4-taskmanager", note: "processes on the machine",
      launch: () => d.open("xfce4-taskmanager"), match: "Task Manager" },
    { app: "ncdu", note: "where the disk went",
      terminal: "ncdu /work", match: null },
    { app: "nano", note: "a file, edited in place",
      terminal: "nano -l /work/out/report.txt", match: null },
  ];

  let got = 0;
  for (const c of CANDIDATES) {
    if (got >= 4) break;
    if (c.terminal) {
      await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
      const tid = await waitFor("Terminal", 20000);
      if (!tid) { log(`  ${c.app}: no terminal`); continue; }
      await present(tid);
      await d.keyboard.type(`clear\n`);
      await sleep(400);
      await d.keyboard.type(`${c.terminal}\n`);
      await sleep(5000);
      await beat(c.app, c.note);
      got += 1;
      await d.keyboard.press("q").catch(() => {});
      await sleep(600);
      await d.keyboard.press("ctrl+x").catch(() => {});
      await sleep(800);
      await kill("Terminal");
      await sleep(1200);
      continue;
    }
    await c.launch().catch((e) => log("  launch:", e.message.slice(0, 60)));
    const id = await waitFor(c.match, c.wait ?? 60000);
    if (!id) { log(`  ${c.app}: never appeared`); continue; }
    await sleep(2500);
    await kill("Tip of the Day");
    await present(id);
    if (c.after) await c.after().catch(() => {});
    await sleep(1200);
    await beat(c.app, c.note);
    got += 1;
    await sleep(1200);
    await X(`xdotool windowkill ${id}; true`).catch(() => {});
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
