/**
 * Records the three short product-card loops: one per lane.
 *
 *   node scripts/record-clips.mjs browser    golden template, Chrome full screen on a live WebGL page
 *   node scripts/record-clips.mjs creative   warm snapshot, Blender driven in the GUI, then a headless render
 *
 * Every clip is a real lease. The only staging is window placement and font size, so the
 * work is legible when the video is shown in a small card.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const OUT = "agent-runs/lane-clips";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARM_SNAPSHOT = "snap_dl6qfkqsxrrh";      // kleeto-creative-warm: Blender + Inkscape installed

const which = process.argv[2] ?? "browser";
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) { log("sweeping", s.sandboxId.slice(0, 12)); await a.sandboxes.kill(s.sandboxId).catch(() => {}); }

const lane = { id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 };
log("provisioning", which === "creative" ? "from the warm snapshot" : "a clean desktop");
const lease = await a.provision(lane, {
  timeoutMs: 1_800_000,
  metadata: { kleeto: `clip-${which}` },
  ...(which === "creative" ? { fromSnapshot: WARM_SNAPSHOT } : {}),
});
const d = lease.h;
log("up:", lease.id.slice(0, 14), "…");

const sh = (line) => lease.sh(line);
const X = (line) => sh(`export DISPLAY=:0; ${line}`);
const shot = async (tag) => {
  try { writeFileSync(`${OUT}/${which}-${tag}.png`, Buffer.from(await d.screenshot({ format: "png" }))); log("  shot", tag); }
  catch (e) { log("  shot failed", tag, e.message.slice(0, 50)); }
};
const full = (match) => X(`wmctrl -r '${match}' -b add,fullscreen; true`).catch(() => {});
const focus = (match) => X(`id=$(xdotool search --onlyvisible --name '${match}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});

/** Capture one clip: start the guest recorder, run `body`, stop, pull the mp4. */
async function capture(name, body) {
  const rec = await d.record.start({ fps: 15 }).catch((e) => { log("  record.start:", e.message.slice(0, 80)); return null; });
  log("recording", name, "->", rec?.path);
  try { await body(); } finally {
    const st = await d.record.stop().catch((e) => { log("  record.stop:", e.message.slice(0, 80)); return null; });
    if (st?.path) {
      const { url } = await d.downloadUrl(st.path);
      const r = await fetch(url);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        writeFileSync(`${OUT}/${name}.mp4`, buf);
        log(`  saved ${name}.mp4`, (buf.length / 1e6).toFixed(1), "MB");
      } else log("  fetch failed", r.status);
    }
  }
}

try {
  await lease.channel();
  await d.health();
  const { w: W, h: H } = await d.display.size().catch(() => ({ w: 1280, h: 720 }));
  log("display", `${W}x${H}`);
  // wmctrl drives fullscreen; installed before any recorder starts.
  if (!(await sh("which wmctrl || true")).trim()) {
    log("installing wmctrl");
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 4000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});

  if (which === "browser") {
    /* ----------------------------------------------------------- browser clip ---- */
    // A map, not a WebGL demo: these guests have no GPU, so a three.js canvas renders
    // blank. Tile imagery is plain HTTP, fills the frame, and panning reads clearly even
    // when the video is shown in a small card.
    const URL = "https://www.openstreetmap.org/#map=13/48.8566/2.3522";
    await d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
      "--start-fullscreen", "--disable-features=Translate", URL]).catch((e) => log("  chrome:", e.message.slice(0, 60)));
    for (let i = 0; i < 20; i++) {
      await sleep(700);
      await X("for id in $(xdotool search --onlyvisible --name 'about:blank'); do xdotool windowkill $id; done; true").catch(() => {});
      if (String(await X("xdotool search --onlyvisible --name 'OpenStreetMap' | head -1").catch(() => "")).trim()) break;
    }
    await sleep(9000);                       // let the tiles come in
    await full("OpenStreetMap");
    await sleep(2500);
    // The first-visit panel covers a third of the frame; close it before recording.
    await d.mouse.click(327, 128).catch(() => {});
    await sleep(1500);
    await shot("loaded");
    await capture("browser", async () => {
      await focus("OpenStreetMap");
      await sleep(1500);
      // A task, not a joyride: search the site, take the first result, then zoom in.
      await d.mouse.click(110, 80).catch(() => {});
      await sleep(800);
      await d.keyboard.type("Eiffel Tower");
      await sleep(900);
      await d.keyboard.press("Return").catch(() => {});
      await sleep(6000);
      await shot("searched");
      await d.mouse.click(150, 200).catch(() => {});     // first result
      await sleep(6000);
      await shot("result");
      for (let i = 0; i < 2; i++) { await d.mouse.click(1259, 84).catch(() => {}); await sleep(3500); }
      await shot("zoomed");
      await d.mouse.drag({ x: 760, y: 420 }, { x: 640, y: 320 }).catch(() => {});
      await sleep(3500);
      await shot("final");
    });
  } else {
    /* ---------------------------------------------------------- creative clips ---- */
    log("blender:", (await sh("which blender && blender --version | head -1").catch(() => "missing")).trim().replace(/\n/g, " | "));
    // Make sure a scene exists to open — the snapshot may predate the render.
    await sh(`mkdir -p /work/out && test -f /work/out/scene.blend || cat > /work/scene.py <<'PY'
import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_monkey_add(location=(0,0,0)); bpy.ops.object.shade_smooth()
l = bpy.data.objects.new('L', bpy.data.lights.new('L', type='AREA')); bpy.context.collection.objects.link(l)
l.location = (4,-4,6); l.data.energy = 900
cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); bpy.context.collection.objects.link(cam)
cam.location = (6,-6,4); cam.rotation_euler = (math.radians(63), 0, math.radians(46)); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_EEVEE'; s.render.resolution_x = 960; s.render.resolution_y = 540
bpy.ops.wm.save_as_mainfile(filepath='/work/out/scene.blend')
PY
test -f /work/out/scene.blend || blender -b --python /work/scene.py >/dev/null 2>&1; ls -l /work/out/`).then((o) => log("  scene:", o.trim().split("\n").pop()));

    // ---- clip 1: Blender, driven in the GUI
    await d.process.start("blender /work/out/scene.blend").catch(() => d.open("blender", ["/work/out/scene.blend"]));
    await sleep(22000);
    await full("Blender");
    await sleep(2500);
    await focus("Blender");
    await d.keyboard.press("Escape").catch(() => {});     // dismiss the splash
    await sleep(1500);
    await shot("blender-open");
    await capture("desktop", async () => {
      // Orbit the viewport, frame the camera, then render — all through real input.
      await d.mouse.move(640, 380).catch(() => {});
      for (const dx of [40, 80, 120, 160]) { await d.mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 360 }, "middle").catch(() => {}); await sleep(500); }
      await sleep(1200);
      await d.keyboard.press("KP_0").catch(() => {});      // camera view
      await sleep(2500);
      await shot("blender-camera");
      await d.keyboard.press("F12").catch(() => {});       // render
      await sleep(14000);                                  // the render window fills in
      await shot("blender-render");
      await sleep(3000);
    });

    // ---- clip 2: the same machine doing the headless version, in a terminal
    await X("for id in $(xdotool search --onlyvisible --name 'Blender'); do xdotool windowkill $id; done; true").catch(() => {});
    await sleep(2000);
    await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 15"]).catch(() => {});
    await sleep(4000);
    await full("Terminal");
    await sleep(1200);
    await focus("Terminal");
    await d.keyboard.type("clear\n");
    await sleep(600);
    await capture("machine", async () => {
      await d.keyboard.type("blender -b /work/out/scene.blend -o /work/out/frame_ -f 1\n");
      await sleep(20000);                                  // per-tile progress streams past
      await shot("render-log");
      await d.keyboard.type("sha256sum /work/out/*.png | head -3\n");
      await sleep(4000);
      await shot("hashed");
      await sleep(2000);
    });
  }
} finally {
  log("tearing down");
  await lease.terminate().catch((e) => log("  teardown:", e.message.slice(0, 60)));
}
log("done");
