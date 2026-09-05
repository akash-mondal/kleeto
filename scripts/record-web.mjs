/**
 * Shoots browser workflows on real, well-made sites — the shapes TinyFish describes in
 * its own case studies: price and inventory checks on a storefront, reading a live
 * operations dashboard, reviewing a change in a repository, and planning a route.
 *
 * The previous browser shot was a raw httpbin form. It was a real job but it looked like
 * a 1997 test page, which is not what a rented browser is for.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/web";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 3_000_000, metadata: { kleeto: "web" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (n) => { try { writeFileSync(`${OUT}/${n}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };
async function waitWindow(m, max) {
  const s = Date.now();
  while (Date.now() - s < max) {
    const id = String(await X(`xdotool search --onlyvisible --name '${m}' | head -1`).catch(() => "")).trim();
    if (id) return id.split("\n")[0];
    await sleep(1200);
  }
  return null;
}

let recStart = 0;
const beats = [], cursor = [];
const now = () => +((Date.now() - recStart) / 1000).toFixed(2);
const mouse = {
  async move(x, y) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.move(x, y).catch(() => {}); },
  async click(x, y) { cursor.push({ t: now(), x, y, k: "click" }); await d.mouse.click(x, y).catch(() => {}); },
  async scroll(x, y, dy) { cursor.push({ t: now(), x, y, k: "move" }); await d.mouse.scroll(x, y, { dy }).catch(() => {}); },
};
const beat = async (app, prompt, doing, phase) => {
  const at = now();
  beats.push({ app, prompt, doing, phase, at });
  log(`  ${app.padEnd(22)} ${phase.padEnd(9)} @ ${at.toFixed(1)}s`);
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

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  const FLAGS = ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--password-store=basic", "--disable-save-password-bubble",
    "--disable-features=PasswordLeakDetection,Translate,AutofillServerCommunication",
    "--hide-scrollbars", "--start-fullscreen"];

  const ONLY = process.argv[2];
  const FLOWS = [
    {
      app: "Storefront", match: "Acme Store|Next.js Commerce|Chrome", wait: 60000,
      url: "https://demo.vercel.store/",
      prompt: "Check the price and stock on the store's featured item.",
      doing: "opening the product and reading the options",
      act: async () => {
        await sleep(5000);
        await mouse.scroll(640, 420, 320); await sleep(1800);
        await shot("store-grid");
        await mouse.click(430, 330); await sleep(6000);          // open a product
        await shot("store-product");
        await mouse.move(900, 430); await sleep(1200);
        await mouse.click(900, 430); await sleep(2500);          // pick a variant
      },
    },
    {
      app: "Grafana", match: "Grafana|Chrome", wait: 60000,
      url: "https://play.grafana.org/d/lAoEVhD7z/home-kubernetes-integration?orgId=1&from=now-1h&to=now",
      prompt: "Check the service dashboard for the last hour.",
      doing: "reading the live panels",
      act: async () => {
        await sleep(9000);
        await shot("grafana-loaded");
        await mouse.scroll(640, 420, 300); await sleep(2500);
        await mouse.move(700, 380); await sleep(1500);
      },
    },
    {
      app: "GitHub", match: "Pull requests|GitHub|Chrome", wait: 60000,
      url: "https://github.com/facebook/react/pulls",
      prompt: "Open the newest pull request and show me the diff.",
      doing: "reading the changed files",
      act: async () => {
        await sleep(6000);
        await shot("gh-list");
        await mouse.click(300, 513); await sleep(8000);           // open the first PR
        await shot("gh-pr");
        await mouse.click(430, 300); await sleep(7000);           // Files changed
        await shot("gh-diff");
        await mouse.scroll(640, 420, 300); await sleep(2000);
      },
    },
    {
      app: "OpenStreetMap", match: "OpenStreetMap|Chrome", wait: 50000,
      url: "https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.8606%2C2.3376%3B48.8809%2C2.3553",
      prompt: "Plan a driving route from the Louvre to Gare du Nord.",
      doing: "reading the turn-by-turn directions",
      act: async () => { await sleep(7000); await mouse.move(800, 380); await sleep(1500); },
    },
  ];

  for (const f of FLOWS.filter((x) => !ONLY || x.app.toLowerCase().includes(ONLY.toLowerCase()))) {
    await d.open("google-chrome", [...FLAGS, f.url]).catch((e) => log("  chrome:", e.message.slice(0, 50)));
    const id = await waitWindow(f.match, f.wait);
    if (!id) { log(`  ${f.app}: no window`); continue; }
    await sleep(3000);
    await kill("Welcome to Google Chrome");
    await X(`xdotool windowactivate --sync ${id}; wmctrl -i -r ${id} -b add,fullscreen; true`).catch(() => {});
    await sleep(2500);
    await beat(f.app, f.prompt, f.doing, "thinking");
    await f.act().catch(() => {});
    await sleep(800);
    await beat(f.app, f.prompt, f.doing, "acting");
    await sleep(1200);
    await X(`xdotool windowkill ${id}; true`).catch(() => {});
    await sleep(2000);
  }

  const st = await d.record.stop().catch(() => null);
  log("finalized:", st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/raw.mp4`, Buffer.from(await r.arrayBuffer())); log("saved raw.mp4"); }
  }
  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  writeFileSync(`${OUT}/cursor.json`, JSON.stringify(cursor, null, 1));
  console.table(beats.filter((b) => b.phase === "acting").map((b) => ({ app: b.app, at: b.at })));
} finally { await lease.terminate().catch(() => {}); }
log("done");
