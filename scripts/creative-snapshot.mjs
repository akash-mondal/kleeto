import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync } from "node:fs";
process.on("unhandledRejection", (e) => console.error("  (late:", e?.message, ")"));
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(()=>{});

const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 1_800_000, metadata: { kleeto: "creative-warm" } });
console.log("desktop-4 up:", lease.id.slice(0, 18), "| disk:", (await lease.sh("df -h / | tail -1")).trim());
try {
  const t0 = Date.now();
  console.log("installing blender + inkscape (detached, polled)…");
  await lease.runLong(
    "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends blender inkscape",
    { onTick: (t) => t && console.log("   …", t.slice(0, 90)) }
  );
  console.log(`  installed in ${Math.round((Date.now()-t0)/1000)}s`);
  console.log(" ", (await lease.sh("blender --version | head -1; inkscape --version | head -1")).trim().replace(/\n/g," | "));

  await lease.sh(`mkdir -p /work/out && cat > /work/scene.py <<'PY'
import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_monkey_add(location=(0,0,0)); bpy.ops.object.shade_smooth()
l=bpy.data.objects.new('L', bpy.data.lights.new('L', type='AREA')); bpy.context.collection.objects.link(l)
l.location=(4,-4,6); l.data.energy=900
cam=bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); bpy.context.collection.objects.link(cam)
cam.location=(6,-6,4); cam.rotation_euler=(math.radians(63),0,math.radians(46)); bpy.context.scene.camera=cam
s=bpy.context.scene; s.render.engine='BLENDER_EEVEE'; s.render.resolution_x=800; s.render.resolution_y=600
s.render.filepath='/work/out/render.png'; bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath='/work/out/scene.blend')
PY`);
  const tr = Date.now();
  await lease.runLong("cd /work && blender -b --python /work/scene.py", { pollMs: 5000 });
  console.log(`  rendered in ${Math.round((Date.now()-tr)/1000)}s`);

  const { artifacts, root } = await lease.artifacts("/work/out");
  console.table(artifacts.map(x => ({ path: x.path.replace("/work/out/",""), bytes: x.bytes, sha256: x.sha256.slice(0,12)+"…" })));
  console.log("artifact root:", root);
  const png = await lease.readFile("/work/out/render.png");
  writeFileSync("agent-runs/blender-render.png", png);
  console.log("pulled render ->", png.length, "bytes");

  const snap = await lease.snapshot("kleeto-creative-warm");
  console.log("SNAPSHOT:", typeof snap === "string" ? snap : JSON.stringify(snap));
} catch (e) { console.error("FAILED:", e.message); }
finally { const { seconds } = await lease.terminate(); console.log(`held ${seconds}s`); }
