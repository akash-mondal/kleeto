/**
 * Re-shoots the two desktop showcase stills.
 *
 * The old pair were an empty spreadsheet grid and an empty Dia canvas: both white app
 * chrome with nothing in them, and near-identical at card size. These two are chosen to
 * be full of content and to look nothing like each other, and the pointer position is
 * logged at the moment of capture so the card can draw the agent's cursor where it
 * actually was.
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
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const place = (m, x, y, w, h) => X(`wmctrl -r '${m}' -b remove,maximized_vert,maximized_horz; sleep 0.3; wmctrl -r '${m}' -e 0,${x},${y},${w},${h}; true`).catch(() => {});
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
const marks = {};
const point = async (name, x, y) => { await d.mouse.move(x, y).catch(() => {}); marks[name] = { x, y }; await sleep(700); };

try {
  await lease.channel(); await d.health();
  if (!(await sh("which wmctrl || true")).trim()) {
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 5000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /work/out && cd /work/out && (test -f render.png || cp frame_0001.png render.png 2>/dev/null); " +
    "printf 'region,q1,q2,q3,q4\\nnorth,120,180,150,210\\nsouth,90,140,190,160\\neast,200,170,220,260\\nwest,60,110,130,170\\n' > sales.csv; " +
    "libreoffice --headless -env:UserInstallation=file:///tmp/lo-x --convert-to ods sales.csv >/dev/null 2>&1; " +
    "libreoffice --headless -env:UserInstallation=file:///tmp/lo-x --convert-to pdf sales.csv >/dev/null 2>&1; pkill -f soffice; ls").catch(() => {});
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});

  /* ---------- A: several apps at once, all with content in them ---------- */
  await d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars", "--window-position=0,26", "--window-size=690,400",
    "https://en.wikipedia.org/wiki/Torus_knot"]).catch(() => {});
  await waitWindow("Torus knot|Chrome", 45000);
  await sleep(7000);
  await kill("about:blank"); await kill("Welcome to Google Chrome");
  await place("Torus knot", 0, 26, 690, 400);

  await d.open("libreoffice", ["--calc", "--norestore", "--nologo", "-env:UserInstallation=file:///tmp/lo-x", "/work/out/sales.ods"]).catch(() => {});
  await waitWindow("sales", 60000);
  await sleep(3000);
  await kill("Tip of the Day");
  await place("sales", 690, 26, 590, 400);

  await d.open("evince", ["/work/out/sales.pdf"]).catch(() => {});
  await waitWindow("sales.pdf", 35000);
  await sleep(3500);
  await place("sales.pdf", 690, 426, 590, 294);

  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 11"]).catch(() => {});
  await waitWindow("Terminal", 25000);
  await sleep(3000);
  await place("Terminal", 0, 426, 690, 294);
  await X("id=$(xdotool search --onlyvisible --name 'Terminal' | tail -1); xdotool windowactivate --sync $id; true").catch(() => {});
  await d.keyboard.type("python3 -c \"import csv;r=list(csv.DictReader(open('/work/out/sales.csv')));print('regions',len(r));print('q4 total',sum(int(x['q4']) for x in r))\"\n");
  await sleep(3500);
  await point("several", 470, 300);
  await shot("several-apps");

  /* ---------- B: the prepared machine, its tools already installed ---------- */
  await kill("Torus knot"); await kill("sales"); await kill("sales.pdf"); await kill("Terminal");
  await sleep(2000);
  await d.open("thunar", ["/work/out"]).catch(() => {});
  await waitWindow("File Manager|out", 35000);
  await sleep(4000);
  await place("File Manager", 0, 26, 700, 694);
  await d.open("ristretto", ["/work/out/render.png"]).catch(() => {});
  await waitWindow("Ristretto|render", 35000);
  await sleep(4000);
  await place("Ristretto", 700, 26, 580, 694);
  await X("id=$(xdotool search --onlyvisible --name 'File Manager' | tail -1); xdotool windowactivate --sync $id; true").catch(() => {});
  await sleep(800);
  await point("prepared", 300, 250);
  await shot("prepared");

  writeFileSync(`${OUT}/marks.json`, JSON.stringify(marks, null, 1));
  console.table(marks);
} finally { await lease.terminate().catch(() => {}); }
log("done");
