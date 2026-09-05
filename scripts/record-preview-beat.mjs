/** Re-shoots the one beat that failed in the film take: serve the outputs off the
 *  machine and open its public preview URL in the browser. */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
process.on("unhandledRejection", () => {});
const OUT = "agent-runs/film"; mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 900_000, fromSnapshot: "snap_dl6qfkqsxrrh", metadata: { kleeto: "film-preview" } });
const d = lease.h;
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const full = (m) => X(`wmctrl -r '${m}' -b add,fullscreen; true`).catch(() => {});
const focus = (m) => X(`id=$(xdotool search --onlyvisible --name '${m}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});
const kill = (m) => X(`for id in $(xdotool search --onlyvisible --name '${m}'); do xdotool windowkill $id; done; true`).catch(() => {});
const shot = async (t) => { try { writeFileSync(`${OUT}/${t}.png`, Buffer.from(await d.screenshot({ format: "png" }))); } catch {} };
const beats = [];
let recStart = 0;
const beat = (n) => { beats.push({ name: n, at: +((Date.now() - recStart) / 1000).toFixed(2) }); log("  beat", n, beats.at(-1).at + "s"); };

try {
  await lease.channel(); await d.health();
  log("up:", lease.id.slice(0, 14));
  if (!(await sh("which wmctrl || true")).trim()) {
    await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl", { pollMs: 4000 }).catch(() => {});
  }
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  // previewUrl is async — the film take echoed the unresolved promise.
  // previewUrl resolves to { url, token }, not a bare string.
  const pv = await lease.previewUrl(8080);
  const preview = typeof pv === "string" ? pv : pv.url;
  // The signed token is not something to put on camera; the terminal shows the host only.
  const shown = preview.split("?")[0];
  log("preview:", shown);
  await sh("ls /work/out | head -8").then((o) => log("serving:", o.trim().replace(/\n/g, " ")));
  // Chrome's first run in a restored snapshot pops a "Welcome" dialog; a seeded
  // First Run marker and the full flag set keep it off camera.
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});

  const rec = await d.record.start({ fps: 15 }).catch(() => null);
  recStart = Date.now();
  log("recording ->", rec?.path);

  beat("serve");
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 14"]).catch(() => {});
  await sleep(3500); await full("Terminal"); await sleep(900); await focus("Terminal");
  await d.keyboard.type("clear\n"); await sleep(500);
  await d.keyboard.type("cd /work/out && python3 -m http.server 8080 &\n");
  await sleep(2500);
  await d.keyboard.type(`echo "${shown}"\n`);
  await sleep(3000);
  await shot("10-serve");

  beat("open-preview");
  await d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--disable-features=Translate", "--start-fullscreen", preview]).catch(() => {});
  for (let i = 0; i < 18; i++) {
    await sleep(700);
    await kill("about:blank"); await kill("Welcome to Google Chrome");
    if (String(await X("xdotool search --onlyvisible --name 'Directory listing' | head -1").catch(() => "")).trim()) break;
  }
  await sleep(4000);
  await full("Directory listing");
  await sleep(2000);
  await shot("11-listing");

  beat("open-artifact");
  await focus("Directory listing");
  // The rendered frame, served straight off the machine.
  await d.mouse.click(120, 150).catch(() => {});
  await sleep(6000);
  await shot("12-artifact");
  await sleep(2500);
  beat("end");

  const st = await d.record.stop().catch(() => null);
  log("finalized:", st?.path, st ? (st.sizeBytes / 1e6).toFixed(1) + " MB" : "");
  if (st?.path) {
    const { url } = await d.downloadUrl(st.path);
    const r = await fetch(url);
    if (r.ok) { writeFileSync(`${OUT}/preview.mp4`, Buffer.from(await r.arrayBuffer())); log("saved preview.mp4"); }
  }
  writeFileSync(`${OUT}/preview-beats.json`, JSON.stringify({ beats, preview: shown }, null, 1));
  console.table(beats);
} finally { await lease.terminate().catch(() => {}); }
log("done");
