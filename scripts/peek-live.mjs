/**
 * Look at what a live view is actually showing.
 *
 * Loads the viewer page the way a person would, over the public URL, and pulls frames off the
 * same WebSocket the browser uses. Confirms two things at once: that the machine is doing what
 * the agent says it is, and that nothing on the page names a supplier.
 */
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";

const url = process.argv[2];
const tag = process.argv[3] ?? "peek";
mkdirSync("agent-runs/live", { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(14000);                      // let a frame or two land

const state = await p.evaluate(() => ({
  state: document.getElementById("state")?.textContent,
  meter: document.getElementById("meter")?.textContent,
  hasFrame: !document.getElementById("screen")?.hidden,
  status: document.getElementById("status")?.textContent,
  hosts: [...new Set((document.documentElement.outerHTML.match(/https?:\/\/[a-z0-9.-]+/gi) ?? []))],
}));
console.log(`viewer   state=${state.state} meter=${state.meter} frame=${state.hasFrame}${state.status ? " status=" + state.status : ""}`);
console.log(`hosts on the page: ${state.hosts.length ? state.hosts.join(", ") : "none"}`);

const shot = await p.screenshot();
writeFileSync(`agent-runs/live/${tag}.png`, shot);
console.log(`saved agent-runs/live/${tag}.png (${(shot.length / 1024).toFixed(0)} KB)`);

// OCR-free check that the frame is a real screen rather than a blank panel
const px = await p.evaluate(() => {
  const img = document.getElementById("screen");
  if (!img || img.hidden) return null;
  const c = document.createElement("canvas");
  c.width = 160; c.height = 90;
  c.getContext("2d").drawImage(img, 0, 0, 160, 90);
  const d = c.getContext("2d").getImageData(0, 0, 160, 90).data;
  let min = 255, max = 0, sum = 0;
  for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i+1] + d[i+2]) / 3; min = Math.min(min, v); max = Math.max(max, v); sum += v; }
  return { min: Math.round(min), max: Math.round(max), mean: Math.round(sum / (d.length / 4)) };
});
console.log(px ? `frame brightness min=${px.min} max=${px.max} mean=${px.mean} (contrast ${px.max - px.min})` : "no frame yet");
await b.close();
