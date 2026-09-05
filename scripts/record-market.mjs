/**
 * Re-shoots the marketplace beat. eBay served an error page to the session, so this uses
 * Craigslist — a classifieds site with no public API at all, which is the point: the only
 * way an agent reads these listings is by opening a browser on them.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
process.on("unhandledRejection", () => {});
const OUT = "agent-runs/market"; mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 1_800_000, metadata: { kleeto: "market" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
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
let recStart = 0; const beats = [], cursor = [];
const now = () => +((Date.now() - recStart) / 1000).toFixed(2);
const mouse = {
  async click(x, y) { cursor.push({ t: now(), x, y, k: "click" }); await d.mouse.click(x, y).catch(() => {}); },
  async move(x, y) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.move(x, y).catch(() => {}); },
  async scroll(x, y, dy) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.scroll(x, y, { dy }).catch(() => {}); },
};
const beat = async (app, prompt, doing, phase) => {
  beats.push({ app, prompt, doing, phase, at: now() });
  log(`  ${app} ${phase} @ ${now()}s`);
  await shot(`${String(beats.length).padStart(2, "0")}-${app}-${phase}`);
};
try {
  await lease.channel(); await d.health();
  if (!(await sh("which wmctrl || true")).trim()) {
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 5000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  const FLAGS = ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--password-store=basic", "--disable-features=PasswordLeakDetection,Translate", "--hide-scrollbars", "--start-fullscreen"];
  await d.open("google-chrome", [...FLAGS, "https://sfbay.craigslist.org/search/sya?query=thinkpad%20x1&sort=priceasc"]).catch(() => {});
  const id = await waitWindow("craigslist|thinkpad|Chrome", 60000);
  if (!id) { log("no window"); } else {
    await sleep(9000);
    await kill("Welcome to Google Chrome");
    await X(`xdotool windowactivate --sync ${id}; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
    await sleep(3500);
    await beat("Craigslist", "What is this model going for locally, and who will take an offer?", "reading the listings", "thinking");
    await mouse.scroll(640, 420, 300); await sleep(3000);
    await shot("list");
    await mouse.click(430, 300); await sleep(9000);        // open a listing
    await mouse.scroll(640, 420, 220); await sleep(3000);
    await beat("Craigslist", "What is this model going for locally, and who will take an offer?", "reading price, condition and location", "acting");
    await sleep(2000);
  }
  const st = await d.record.stop().catch(() => null);
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/raw.mp4`, Buffer.from(await r.arrayBuffer())); log("saved raw.mp4"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  writeFileSync(`${OUT}/cursor.json`, JSON.stringify(cursor, null, 1));
} finally { await lease.terminate().catch(() => {}); }
log("done");
