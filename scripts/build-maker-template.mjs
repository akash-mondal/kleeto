/**
 * A desktop image with the tools the launch video wants, none of which the built-in templates
 * carry: KiCad and FreeCAD for the hardware beats, Blender, GIMP and Inkscape for the creative
 * ones, Audacity, and the two window tools every shoot script needs.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
const t0 = Date.now();
const built = await a.buildTemplate("kleeto-desktop-maker", {
  kind: "desktop",
  from: "solari/workstation",
  // The image's apt lists are stale and universe may be off, so the install is one explicit
  // step rather than the builder's aptInstall, which failed with exit 100 on this base.
  run: [
    "apt-get update -qq && (apt-get install -y -qq software-properties-common >/dev/null 2>&1; add-apt-repository -y universe >/dev/null 2>&1; apt-get update -qq)",
    "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq kicad freecad blender gimp inkscape audacity imagemagick wmctrl xdotool poppler-utils",
  ],
});
console.log("build:", JSON.stringify(built).slice(0, 300));
const id = built.templateId ?? built.id;
while (true) {
  const s = await a.templateStatus(id).catch((e) => ({ status: "error", error: e.message }));
  console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(5)}s] ${s.status ?? JSON.stringify(s).slice(0, 120)}`);
  if (["ready", "failed", "error"].includes(s.status)) { console.log(JSON.stringify(s).slice(0, 600)); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
