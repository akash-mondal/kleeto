/**
 * What a second visit actually costs.
 *
 * Playwright reports cached responses the same way it reports network ones, so this asks
 * Chrome directly through CDP whether each response came off disk.
 */
import { chromium } from "playwright-core";

const target = process.argv[2] ?? "https://kleeto.fun";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send("Network.enable");

let tally;
cdp.on("Network.responseReceived", (e) => {
  if (!tally) return;
  const cached = e.response.fromDiskCache || e.response.fromPrefetchCache;
  tally.files++;
  if (cached) tally.cached++;
  else tally.bytes += e.response.encodedDataLength || 0;
});
cdp.on("Network.loadingFinished", (e) => { if (tally && e.encodedDataLength) tally.wire += e.encodedDataLength; });

async function load(label) {
  tally = { files: 0, cached: 0, bytes: 0, wire: 0 };
  await p.goto(target, { waitUntil: "networkidle", timeout: 120000 });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
  });
  await p.waitForTimeout(3000);
  console.log(`${label}: ${tally.files} responses, ${tally.cached} from cache, ${(tally.wire / 1024).toFixed(0)} KB over the wire`);
  tally = null;
}
await load("first visit ");
await load("second visit");
await b.close();
