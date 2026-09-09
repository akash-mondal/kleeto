/**
 * The bring-your-own-image route that is known to work: install everything on a live desktop,
 * then snapshot it. Leases boot from the snapshot in seconds with all of it present.
 *
 * KiCad and FreeCAD for the hardware beats, Blender, GIMP and Inkscape for the creative ones,
 * Audacity, and the window tools every shoot script relies on.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync } from "node:fs";
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(5)}s]`, ...x);
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_600_000, template: "workstation", metadata: { kleeto: "maker-snapshot" } });
log("up");
try {
  await lease.runLong("apt-get update -qq 2>&1 | tail -1", { pollMs: 5000 });
  log("installing");
  const out = await lease.runLong(
    "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq kicad freecad blender gimp inkscape audacity wmctrl poppler-utils 2>&1 | tail -3",
    { pollMs: 10000, timeoutMs: 2_400_000 });
  log(out.trim().slice(-300));
  const check = await lease.sh("for b in kicad freecad blender gimp inkscape audacity wmctrl pdftotext; do printf '%s=%s ' $b \"$(which $b >/dev/null && echo ok || echo MISSING)\"; done; echo; df -h / | tail -1");
  log(check.trim());
  if (/MISSING/.test(check)) throw new Error("a tool is missing, not snapshotting");
  await lease.sh("apt-get clean; rm -rf /var/lib/apt/lists/*; sync");
  log("snapshotting");
  const snap = await lease.snapshot("kleeto-desktop-maker");
  log("snapshot:", JSON.stringify(snap).slice(0, 200));
  writeFileSync("agent-runs/maker-snapshot.json", JSON.stringify(snap, null, 1));
} finally { await lease.terminate().catch(() => {}); log("terminated"); }
