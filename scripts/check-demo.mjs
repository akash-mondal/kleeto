import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 120)));
p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 120)));
await p.goto("https://kleeto.fun/demo", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(9000);   // shaders build a document then start animating
const info = await p.evaluate(() => {
  const frames = [...document.querySelectorAll("iframe")];
  return {
    iframes: frames.length,
    sandboxes: frames.map((f) => f.getAttribute("sandbox")),
    sizes: frames.map((f) => `${Math.round(f.getBoundingClientRect().width)}x${Math.round(f.getBoundingClientRect().height)}`),
    heading: document.querySelector("h1")?.textContent,
    model: [...document.querySelectorAll("span")].map((s) => s.textContent?.trim()).filter((t) => t === "GPT-6 Astra" || t === "High"),
    balance: document.body.innerText.match(/0\.0\.\d+|[\d.]+ HBAR|[\d.]+ USDC/g)?.slice(0, 4),
    presets: [...document.querySelectorAll("button")].map((x) => x.textContent?.trim()).filter(Boolean).slice(0, 5),
  };
});
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: "agent-runs/live/demo-page.png", fullPage: false });
console.log("console errors:", errs.length ? errs.slice(0, 4) : "none");
await b.close();
