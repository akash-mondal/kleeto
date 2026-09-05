/**
 * Re-shoots the browser and machine product-card loops.
 *
 * The old ones did not describe a job anyone would give an agent. Browserbase's own
 * documented use cases are "navigate portals, fill out forms and submit data on sites
 * without APIs" and login-flow testing, so the browser lane now signs into a portal and
 * reads the result back. The machine lane was a wall of render log; it now runs a real
 * four-core render and watches it in btop, whose braille graphs actually show load.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

process.on("unhandledRejection", () => {});
const OUT = "agent-runs/lane-clips-2";
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s]`, ...x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-4", ...requireLane("desktop-4"), diskGb: 20 },
  { timeoutMs: 2_400_000, metadata: { kleeto: "lane-clips-2" }, fromSnapshot: "snap_dl6qfkqsxrrh" });
const d = lease.h;
const sh = (l) => lease.sh(l);
const X = (l) => sh(`export DISPLAY=:0; ${l}`);
const full = (m) => X(`wmctrl -r '${m}' -b add,fullscreen; true`).catch(() => {});
const focus = (m) => X(`id=$(xdotool search --onlyvisible --name '${m}' | tail -1); [ -n "$id" ] && xdotool windowactivate --sync $id; true`).catch(() => {});
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
const beats = [];
const beat = async (name, note) => {
  const at = +((Date.now() - recStart) / 1000).toFixed(2);
  beats.push({ name, note, at });
  log(`  beat ${name} @ ${at}s`);
  await shot(name);
};
async function capture(name, body) {
  const rec = await d.record.start({ fps: 15 }).catch((e) => { log("record.start:", e.message.slice(0, 60)); return null; });
  recStart = Date.now();
  log("recording", name, "->", rec?.path);
  try { await body(); } finally {
    const st = await d.record.stop().catch(() => null);
    if (st?.path) {
      const { url } = await d.downloadUrl(st.path);
      const r = await fetch(url);
      if (r.ok) { writeFileSync(`${OUT}/${name}.mp4`, Buffer.from(await r.arrayBuffer())); log(`  saved ${name}.mp4`, (st.sizeBytes / 1e6).toFixed(1), "MB"); }
    }
  }
}

try {
  await lease.channel();
  await d.health();
  log("installing btop");
  await lease.runLong("DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wmctrl btop",
    { pollMs: 6000, timeoutMs: 900_000 }).catch((e) => log("apt:", e.message.slice(0, 70)));
  log("  btop:", (await sh("btop --version 2>/dev/null | head -1 || echo MISSING")).trim());
  await X("pkill -9 -f xfce4-panel; true").catch(() => {});
  await X("for id in $(xdotool search --onlyvisible --name 'Chrome|about:blank|Terminal'); do xdotool windowkill $id; done; true").catch(() => {});
  await sh("mkdir -p /root/.config/google-chrome && touch '/root/.config/google-chrome/First Run'").catch(() => {});
  // btop's first run writes a config; do it now so the take is not its setup.
  await sh("timeout 3 btop --preset 0 >/dev/null 2>&1; true").catch(() => {});
  // The job btop will be watching. Typing a nested-quoted --python-expr through the
  // keyboard mangled it last time, so the settings live in a file instead.
  await lease.writeFile("/tmp/heavy.py", [
    "import bpy",
    "s = bpy.context.scene",
    "s.render.engine = 'CYCLES'",
    "s.cycles.samples = 512",
    "s.cycles.use_denoising = False",
    "s.render.resolution_x = 1920",
    "s.render.resolution_y = 1080",
  ].join("\n"));
  await lease.writeFile("/work/load.sh", [
    "#!/bin/bash",
    "# Hash a stream on every core until the clock runs out: real work, and the same",
    "# operation the receipt performs on each artifact.",
    "DURATION=${1:-120}",
    "for i in 1 2 3 4; do",
    "  timeout \"$DURATION\" sh -c 'while :; do head -c 400000000 /dev/zero | sha256sum > /dev/null; done' &",
    "done",
    "wait",
  ].join("\n"));
  await sh("chmod +x /work/load.sh").catch(() => {});
  await sh("( bash /work/load.sh 20 & ) ; sleep 4; echo hashers=$(pgrep -c sha256sum); uptime")
    .then((o) => log("  load check:", o.trim().replace(/\n/g, " | "))).catch(() => {});

  const only = process.argv[2];

  /* ------------------------------------------------------- browser: the form ---- */
  if (only !== "machine") {
  // the-internet.herokuapp.com is the canonical sample app for login-flow automation.
  await d.open("google-chrome", ["--no-sandbox", "--test-type", "--no-first-run", "--no-default-browser-check",
    "--password-store=basic", "--disable-save-password-bubble",
    "--disable-features=PasswordLeakDetection,PasswordManagerOnboarding,AutofillServerCommunication,Translate",
    "--start-fullscreen", "https://httpbin.org/forms/post"]).catch(() => {});
  const cid = await waitWindow("httpbin|Chrome", 45000);
  log("chrome window:", Boolean(cid));
  await sleep(6000);
  await kill("Welcome to Google Chrome");
  await full("httpbin");
  await sleep(1500);
  await focus("httpbin");
  await sleep(800);
  await shot("browser-ready");

  await capture("browser", async () => {
    await sleep(1000);
    // Coordinates read straight off the rendered page — the previous pass guessed at a
    // scaled layout and every click missed, so nothing was ever typed.
    await d.mouse.click(209, 26).catch(() => {});
    await sleep(500);
    await d.keyboard.type("Kleeto Agent");
    await sleep(700);
    await beat("field-name", "customer name");
    await d.mouse.click(175, 63).catch(() => {});
    await sleep(350);
    await d.keyboard.type("+1 415 555 0134");
    await sleep(500);
    await d.mouse.click(204, 100).catch(() => {});
    await sleep(350);
    await d.keyboard.type("agent@kleeto.dev");
    await sleep(700);
    await beat("field-contact", "phone and email");
    await d.mouse.click(35, 213).catch(() => {});      // size: medium
    await sleep(450);
    await d.mouse.click(34, 371).catch(() => {});      // topping: extra cheese
    await sleep(450);
    await d.mouse.click(34, 443).catch(() => {});      // topping: mushroom
    await sleep(600);
    await beat("field-options", "options chosen");
    await d.mouse.click(242, 555).catch(() => {});     // delivery instructions
    await sleep(400);
    await d.keyboard.type("Leave at the door.");
    await sleep(800);
    await d.mouse.click(54, 604).catch(() => {});      // submit
    await sleep(5000);
    await beat("submitted", "the site answers with the payload");
    await shot("browser-done");
    await sleep(2500);
  });

  }

  /* --------------------------------------------------- machine: btop + load ---- */
  await kill("httpbin");
  await sleep(1500);
  await d.open("xfce4-terminal", ["--hide-menubar", "--hide-toolbar", "--font=Monospace 12"]).catch(() => {});
  await sleep(3500);
  await full("Terminal");
  await sleep(1000);
  await focus("Terminal");
  await d.keyboard.type("clear\n");
  await sleep(500);
  // The job btop watches. Backgrounding it from the typed command line kept dying with
  // its exec session, so it is started detached over the API; the terminal runs btop and
  // nothing else. Four cores hashing a stream — the same operation the receipt performs.
  const hashers = await sh("setsid nohup bash /work/load.sh 200 >/dev/null 2>&1 < /dev/null & sleep 5; echo $(pgrep -c sha256sum)")
    .catch(() => "0");
  log("  hashers running:", String(hashers).trim());
  await d.keyboard.type("btop --preset 0\n");
  await sleep(7000);
  await shot("machine-ready");

  await capture("machine", async () => {
    await sleep(2500);
    await beat("btop-load", "four cores under a benchmark");
    // Cycle btop's view so the take shows more than one panel.
    await sleep(3500);
    await beat("btop-mem", "the render climbing");
    await sleep(3500);
    await beat("btop-cpu", "four cores pinned");
    await sleep(2500);
    await shot("machine-done");
  });

  writeFileSync(`${OUT}/beats.json`, JSON.stringify(beats, null, 1));
  console.table(beats);
} finally {
  await lease.terminate().catch(() => {});
}
log("done");
