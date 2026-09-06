/**
 * Second desktop showcase still: the warm snapshot's creative tools, already installed.
 *
 * Ristretto was the first attempt and it opened a thumbnailer error dialog over a black
 * canvas. Inkscape on a real vector file is both dependable and nothing like the four-pane
 * shot beside it.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
process.on("unhandledRejection", () => {});
const OUT = "agent-runs/deskcards"; mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 1_800_000, metadata: { kleeto: "deskcards" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const X = (l) => lease.sh(`export DISPLAY=:0; ${l}`);
const shot = async (n) => { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); log("  shot", n); };
async function waitWindow(m, max) {
  const s = Date.now();
  while (Date.now() - s < max) {
    const id = String(await X(`xdotool search --onlyvisible --name '${m}' | head -1`).catch(() => "")).trim();
    if (id) return id.split("\n")[0];
    await sleep(1500);
  }
  return null;
}

try {
  await lease.channel(); await d.health();

  // A vector file worth editing: concentric arcs, an amber wedge, and labelled type, so the
  // canvas is full of objects and the XML/objects panels have something to list.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
<rect width="900" height="620" fill="#fdf9f0"/>
<g transform="translate(300,310)">
${[...Array(7)].map((_, i) => {
  const r = 60 + i * 26, o = (0.14 + i * 0.06).toFixed(2);
  return `<circle cx="0" cy="0" r="${r}" fill="none" stroke="#2b2622" stroke-opacity="${o}" stroke-width="2"/>`;
}).join("\n")}
<path d="M0,0 L0,-232 A232,232 0 0,1 200,116 Z" fill="#e8a83a" fill-opacity="0.9"/>
<circle cx="0" cy="0" r="34" fill="#2b2622"/>
</g>
<g transform="translate(620,150)" font-family="DejaVu Sans" fill="#2b2622">
<text x="0" y="0" font-size="34" font-weight="700">lease 04</text>
<text x="0" y="38" font-size="17" fill-opacity="0.6">seconds elapsed  418</text>
<text x="0" y="64" font-size="17" fill-opacity="0.6">artifacts        12</text>
<rect x="0" y="92" width="230" height="10" rx="5" fill="#2b2622" fill-opacity="0.1"/>
<rect x="0" y="92" width="152" height="10" rx="5" fill="#e8a83a"/>
</g>
${[...Array(9)].map((_, i) => `<rect x="${620 + i * 26}" y="330" width="18" height="${40 + ((i * 37) % 130)}" rx="3" fill="#e8a83a" fill-opacity="${(0.35 + i * 0.07).toFixed(2)}"/>`).join("\n")}
<text x="620" y="520" font-family="DejaVu Sans Mono" font-size="15" fill="#2b2622" fill-opacity="0.55">out/plate.svg</text>
</svg>`;
  await lease.sh(`mkdir -p /work/out && cat > /work/out/plate.svg <<'SVGEOF'\n${svg}\nSVGEOF\nls -l /work/out/plate.svg`);

  await X("pkill -9 -f ristretto; pkill -9 -f thunar; true").catch(() => {});
  // Inkscape 1.x opens a welcome dialog on a fresh profile; pre-seeding the prefs skips it.
  await lease.sh("mkdir -p /root/.config/inkscape && cat > /root/.config/inkscape/preferences.xml <<'PEOF'\n" +
    '<inkscape version="1.1" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape">\n' +
    '  <group id="options"><group id="boot"><group id="welcome" enabled="0"/></group></group>\n' +
    "</inkscape>\nPEOF").catch(() => {});

  await d.open("inkscape", ["/work/out/plate.svg"]).catch(() => {});
  await waitWindow("plate.svg|Inkscape", 90000);
  await sleep(9000);
  await X("for id in $(xdotool search --onlyvisible --name 'Welcome|Keep|crash'); do xdotool windowkill $id; done; true").catch(() => {});
  await X("wmctrl -r 'Inkscape' -b add,maximized_vert,maximized_horz; true").catch(() => {});
  await sleep(2500);
  await X("id=$(xdotool search --onlyvisible --name 'Inkscape' | tail -1); xdotool windowactivate --sync $id; true").catch(() => {});
  await sleep(800);
  await d.keyboard.press("5");           // fit page in window
  await sleep(1500);
  await d.mouse.move(420, 430).catch(() => {});  // over the amber wedge
  await sleep(400);
  await d.mouse.click(420, 430).catch(() => {}); // select it, so handles + status bar read live
  await sleep(1800);
  await d.mouse.move(452, 396).catch(() => {});
  await sleep(900);
  await shot("prepared");
  writeFileSync(`${OUT}/marks.json`, JSON.stringify({ several: { x: 470, y: 300 }, prepared: { x: 452, y: 396 } }, null, 1));
} finally { await lease.terminate().catch(() => {}); }
log("done");
