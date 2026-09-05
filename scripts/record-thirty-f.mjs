/** Last pass: three terminal programs, to round the montage out to thirty applications.
 *  Terminal beats have landed on every take; the LibreOffice GUI ones never mapped. */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
process.on("unhandledRejection", () => {});
const OUT = "agent-runs/thirty-f"; mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 1_800_000, metadata: { kleeto: "thirty-f" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };
let recStart = 0; const beats = [];
const beat = async (app, note) => {
  const at = (Date.now() - recStart) / 1000;
  beats.push({ n: beats.length + 1, app, note, at: +at.toFixed(2) });
  log(`  ${beats.length}. ${app} @ ${at.toFixed(1)}s`);
  await shot(String(beats.length).padStart(2, "0") + "-" + app.replace(/[^a-z0-9]/gi, ""));
};
try {
  await lease.channel(); await d.health();
  log("up:", lease.id.slice(0, 14));
  await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl ncdu nano", { pollMs: 5000 }).catch(() => {});
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /work/out && printf 'Kleeto — lease report\\n\\nlane        desktop-4\\nseconds     252\\namount      $0.0104\\nfiles out   7\\n' > /work/out/report.txt").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
  await sleep(4000);
  await X("wmctrl -r 'Terminal' -b add,fullscreen; true").catch(() => {});
  await sleep(1200);
  await X("id=$(xdotool search --onlyvisible --name 'Terminal' | tail -1); xdotool windowactivate --sync $id; true").catch(() => {});

  await d.keyboard.type("clear\n"); await sleep(400);
  await d.keyboard.type("ncdu /work\n"); await sleep(6000);
  await beat("ncdu", "where the disk went");
  await d.keyboard.press("q").catch(() => {}); await sleep(1200);

  await d.keyboard.type("clear\n"); await sleep(400);
  await d.keyboard.type("nano -l /work/out/report.txt\n"); await sleep(4500);
  await d.keyboard.type("  checked on a rented desktop"); await sleep(1500);
  await beat("nano", "a file, edited in place");
  await d.keyboard.press("ctrl+x").catch(() => {}); await sleep(700);
  await d.keyboard.press("n").catch(() => {}); await sleep(1200);

  await d.keyboard.type("clear\n"); await sleep(400);
  await d.keyboard.type("top -b -n 3 -d 1 | head -22\n"); await sleep(5000);
  await beat("top", "load, memory, processes");
  await sleep(1500);

  const st = await d.record.stop().catch(() => null);
  log("finalized:", st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/raw.mp4`, Buffer.from(await r.arrayBuffer())); log("saved raw.mp4"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  console.table(beats.map((b) => ({ n: b.n, app: b.app, at: b.at })));
} finally { await lease.terminate().catch(() => {}); }
log("done");
