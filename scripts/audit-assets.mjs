/**
 * What the page actually pulls over the wire, and how it is cached.
 *
 * Records every response for a cold load of the site, so an unoptimised image or an asset
 * that has to be re-fetched on every visit shows up as a number rather than a hunch.
 */
import { chromium } from "playwright-core";

const target = process.argv[2] ?? "https://kleeto.fun";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const seen = [];
page.on("response", async (r) => {
  const h = r.headers();
  let size = Number(h["content-length"] ?? 0);
  if (!size) { try { size = (await r.body()).length; } catch { size = 0; } }
  seen.push({
    url: r.url().replace(target, ""),
    status: r.status(),
    type: h["content-type"]?.split(";")[0] ?? "",
    size,
    cache: h["cache-control"] ?? "",
    vercel: h["x-vercel-cache"] ?? "",
  });
});
await page.goto(target, { waitUntil: "networkidle", timeout: 120000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
});
await page.waitForTimeout(3000);
await browser.close();

const group = (t) => t.startsWith("image/") ? "image" : t.startsWith("video/") ? "video"
  : t.startsWith("font/") || t.includes("font") ? "font"
  : t.includes("javascript") ? "js" : t.includes("css") ? "css" : t.includes("html") ? "html" : "other";
const totals = {};
for (const r of seen) {
  const g = group(r.type);
  totals[g] = totals[g] ?? { n: 0, bytes: 0 };
  totals[g].n++; totals[g].bytes += r.size;
}
console.log("== totals ==");
let all = 0;
for (const [g, v] of Object.entries(totals).sort((a, b) => b[1].bytes - a[1].bytes)) {
  all += v.bytes;
  console.log(`  ${g.padEnd(6)} ${String(v.n).padStart(3)} files  ${(v.bytes / 1024).toFixed(0).padStart(7)} KB`);
}
console.log(`  ${"TOTAL".padEnd(6)} ${String(seen.length).padStart(3)} files  ${(all / 1024).toFixed(0).padStart(7)} KB\n`);
console.log("== the twenty heaviest ==");
for (const r of [...seen].sort((a, b) => b.size - a.size).slice(0, 20)) {
  console.log(`  ${(r.size / 1024).toFixed(0).padStart(6)} KB  ${r.type.padEnd(16)} ${(r.cache || "-").slice(0, 42).padEnd(43)} ${r.url.slice(0, 70)}`);
}
const raw = seen.filter((r) => r.type.startsWith("image/") && !r.url.startsWith("/_next/image") && !r.type.includes("svg"));
console.log("\n== images not going through the optimiser ==");
console.log(raw.length ? raw.map((r) => `  ${(r.size / 1024).toFixed(0)} KB  ${r.url}`).join("\n") : "  none");
const weak = seen.filter((r) => r.size > 40_000 && /max-age=0|no-store|must-revalidate/.test(r.cache));
console.log("\n== heavy assets a repeat visit must revalidate ==");
console.log(weak.length ? weak.map((r) => `  ${(r.size / 1024).toFixed(0)} KB  ${r.cache}  ${r.url}`).join("\n") : "  none");
