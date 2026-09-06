import { SolariAdapter } from "../src/adapters/solari.mjs";
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
console.log("building desktop-creative (blender + gimp + inkscape)…");
const t0 = Date.now();
const built = await a.buildTemplate("kleeto-desktop-creative", {
  kind: "desktop",
  from: "solari/workstation",           // start from the GUI base, not bare ubuntu
  apt: ["blender", "gimp", "inkscape", "imagemagick", "xdotool", "scrot"],
});
console.log("build kicked off:", JSON.stringify(built).slice(0, 200));
console.log(`elapsed ${Math.round((Date.now() - t0) / 1000)}s`);
