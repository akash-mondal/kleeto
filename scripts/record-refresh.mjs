/**
 * Two re-shoots:
 *  1. Blender on a different model — the default monkey reads as a Blender tutorial.
 *  2. A marketplace listing. Reading a GitHub pull request proves nothing: that site has
 *     an API any agent can call. A classifieds listing does not, so a browser is the only
 *     way in — which is the whole argument for renting one.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/refresh";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "refresh" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); log("  shot", n); } catch {} };
async function waitWindow(m, max) {
  const s = Date.now();
  while (Date.now() - s < max) {
    const id = String(await X(`xdotool search --onlyvisible --name '${m}' | head -1`).catch(() => "")).trim();
    if (id) return id.split("\n")[0];
    await sleep(1500);
  }
  return null;
}
let recStart = 0;
const beats = [], cursor = [];
const now = () => +((Date.now() - recStart) / 1000).toFixed(2);
const mouse = {
  async move(x, y) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.move(x, y).catch(() => {}); },
  async click(x, y) { cursor.push({ t: now(), x, y, k: "click" }); await d.mouse.click(x, y).catch(() => {}); },
  async drag(f, t2, b) { cursor.push({ t: now(), ...f, k: "down" }); await d.mouse.drag(f, t2, b).catch(() => {}); cursor.push({ t: now(), ...t2, k: "up" }); },
  async scroll(x, y, dy) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.scroll(x, y, { dy }).catch(() => {}); },
};
const beat = async (app, prompt, doing, phase) => {
  beats.push({ app, prompt, doing, phase, at: now() });
  log(`  ${app.padEnd(14)} ${phase.padEnd(9)} @ ${now().toFixed(1)}s`);
  await shot(`${String(beats.length).padStart(2, "0")}-${app.replace(/[^a-z0-9]/gi, "")}-${phase}`);
};

try {
  await lease.channel();
  await d.health();
  if (!(await sh("which wmctrl || true")).trim()) {
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 5000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});

  // A scene that is plainly not the default monkey: a knotted torus over a floor,
  // built procedurally so it is ours rather than a bundled asset.
  await lease.writeFile("/work/knot.py", `import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
curve = bpy.data.curves.new('knot', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth = 0.16
curve.bevel_resolution = 6
spline = curve.splines.new('NURBS')
N = 220
spline.points.add(N - 1)
for i in range(N):
    t = 2 * math.pi * i / N
    x = math.sin(t) + 2 * math.sin(2 * t)
    y = math.cos(t) - 2 * math.cos(2 * t)
    z = -math.sin(3 * t)
    spline.points[i].co = (x, y, z, 1)
spline.use_cyclic_u = True
spline.use_endpoint_u = True
obj = bpy.data.objects.new('TorusKnot', curve)
bpy.context.collection.objects.link(obj)
mat = bpy.data.materials.new('knot')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.96, 0.70, 0.04, 1)
bsdf.inputs['Metallic'].default_value = 0.85
bsdf.inputs['Roughness'].default_value = 0.25
obj.data.materials.append(mat)
bpy.ops.mesh.primitive_plane_add(size=24, location=(0, 0, -2.2))
light = bpy.data.objects.new('key', bpy.data.lights.new('key', type='AREA'))
bpy.context.collection.objects.link(light)
light.location = (5, -5, 7); light.data.energy = 1400; light.data.size = 6
cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
bpy.context.collection.objects.link(cam)
cam.location = (7.5, -7.5, 5.2); cam.rotation_euler = (math.radians(62), 0, math.radians(45))
bpy.context.scene.camera = cam
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 1280; s.render.resolution_y = 720
bpy.ops.wm.save_as_mainfile(filepath='/work/out/knot.blend')
`);
  await sh("mkdir -p /work/out && blender -b --python /work/knot.py > /tmp/knot.log 2>&1; ls -la /work/out/knot.blend")
    .then((o) => log("scene:", o.trim().split("\n").pop())).catch((e) => log("scene failed:", e.message.slice(0, 80)));

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  /* ---- 1. Blender on the new model ---- */
  await d.open("blender", ["/work/out/knot.blend"]).catch((e) => log("blender:", e.message.slice(0, 60)));
  const bid = await waitWindow("Blender", 75000);
  if (bid) {
    await sleep(6000);
    await X(`xdotool windowactivate --sync ${bid}; wmctrl -i -r ${bid} -b add,fullscreen; true`).catch(() => {});
    await sleep(2500);
    await d.keyboard.press("Escape").catch(() => {});
    await sleep(800);
    await beat("Blender", "Frame the knot and render it.", "opening the scene", "thinking");
    for (const dx of [70, 140]) { await mouse.drag({ x: 640, y: 380 }, { x: 640 + dx, y: 352 }, "middle"); await sleep(500); }
    await d.keyboard.press("KP_0").catch(() => {});
    await sleep(2200);
    await beat("Blender", "Frame the knot and render it.", "framing the camera", "acting");
    await d.keyboard.press("F12").catch(() => {});
    await sleep(14000);
    await beat("Blender", "Frame the knot and render it.", "the render lands", "render");
    await sleep(2000);
    await X(`xdotool windowkill ${bid}; true`).catch(() => {});
    await sleep(2000);
  } else log("blender: no window");

  /* ---- 2. a marketplace listing, on a site with no public API ---- */
  const FLAGS = ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--password-store=basic", "--disable-features=PasswordLeakDetection,Translate", "--hide-scrollbars", "--start-fullscreen"];
  const TRY = [
    { name: "eBay", url: "https://www.ebay.com/sch/i.html?_nkw=vintage+mechanical+keyboard&_sop=15", match: "eBay|vintage" },
    { name: "Craigslist", url: "https://sfbay.craigslist.org/search/sya?query=thinkpad#search=1~gallery~0~0", match: "craigslist|thinkpad" },
  ];
  for (const t of TRY) {
    await d.open("google-chrome", [...FLAGS, t.url]).catch(() => {});
    const id = await waitWindow(t.match, 50000);
    if (!id) { log(`${t.name}: no window`); continue; }
    await sleep(7000);
    await kill("Welcome to Google Chrome");
    await X(`xdotool windowactivate --sync ${id}; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
    await sleep(3000);
    await beat(t.name, "Find what this model is going for and what the seller will take.",
      "reading the listings", "thinking");
    await mouse.scroll(640, 420, 300); await sleep(2500);
    await shot(`${t.name}-list`);
    await mouse.click(420, 330); await sleep(8000);        // open a listing
    await mouse.scroll(640, 420, 260); await sleep(2500);
    await beat(t.name, "Find what this model is going for and what the seller will take.",
      "reading price, condition and shipping", "acting");
    await sleep(1500);
    await X(`xdotool windowkill ${id}; true`).catch(() => {});
    await sleep(2000);
    break;
  }

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
