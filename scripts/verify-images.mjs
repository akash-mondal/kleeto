/**
 * Boot each image and check its tools are really there.
 *
 * A snapshot that built is not the same as a snapshot that works: the build ran on a live
 * machine, and what matters is what a fork of it carries. Cheaper to find a missing binary
 * here than in front of a camera.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const EXPECT = {
  "kleeto-desktop-studio": ["blender", "darktable", "scribus", "kdenlive"],
  "kleeto-desktop-engineering": ["kicad", "freecad", "qgis"],
  "kleeto-desktop-office": ["thunderbird", "gnucash", "remmina", "wireshark", "dbeaver"],
};
const images = JSON.parse(readFileSync("var/images.json", "utf8"));
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
mkdirSync("agent-runs/images", { recursive: true });

for (const [name, tools] of Object.entries(EXPECT)) {
  const snap = images[name]?.snapshotId;
  if (!snap) { console.log(`${name}: not built`); continue; }
  const t0 = Date.now();
  const lease = await a.provision({ id: "desktop-2", ...requireLane("desktop-2"), diskGb: 20 },
    { timeoutMs: 900_000, fromSnapshot: snap, metadata: { kleeto: "verify" } });
  const boot = ((Date.now() - t0) / 1000).toFixed(1);
  try {
    await lease.channel();
    const found = await lease.sh(
      `for b in ${tools.join(" ")}; do printf '%s=%s ' $b "$(command -v $b >/dev/null && echo ok || echo MISSING)"; done`);
    // and prove one of them actually launches, not just that the binary exists
    const app = tools[0];
    await lease.openApp(app).catch(() => {});
    await new Promise((r) => setTimeout(r, 12000));
    const win = await lease.sh(`export DISPLAY=:0; xdotool search --onlyvisible --name '.' getwindowname %@ 2>/dev/null | head -4`).catch(() => "");
    const png = Buffer.from(await lease.screenshot({ format: "png" }));
    writeFileSync(`agent-runs/images/${name}.png`, png);
    console.log(`${name.padEnd(30)} boot ${boot}s  ${found.trim()}`);
    console.log(`${" ".repeat(30)} launched ${app}: windows [${win.trim().replace(/\n/g, " | ").slice(0, 90)}]  shot ${(png.length/1024).toFixed(0)}KB`);
  } finally { await lease.terminate().catch(() => {}); }
}
