import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://kleeto.fun/demo", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(7000);
const s = await p.evaluate(() => {
  const sel = [...document.querySelectorAll("select")];
  return {
    models: [...(sel[0]?.options ?? [])].map((o) => o.text),
    modelValue: sel[0]?.value,
    efforts: [...(sel[1]?.options ?? [])].map((o) => o.text),
    effortValue: sel[1]?.value,
    assets: [...document.querySelectorAll("button")].map((x) => x.textContent?.trim()).filter((t) => t === "USDC" || t === "HBAR"),
    logos: [...document.querySelectorAll("img")].map((i) => i.getAttribute("src")).filter((s) => s?.includes("rail")),
    header: document.querySelector("header")?.innerText.replace(/\n+/g, " · "),
  };
});
console.log(JSON.stringify(s, null, 1));
// switching model must swap the reasoning levels
await p.selectOption("select", { label: "MiniMax-M3" }).catch(() => {});
await p.waitForTimeout(700);
const after = await p.evaluate(() => {
  const sel = [...document.querySelectorAll("select")];
  return { model: sel[0]?.value, efforts: [...(sel[1]?.options ?? [])].map((o) => o.text), value: sel[1]?.value };
});
console.log("after switching to MiniMax:", JSON.stringify(after));
await b.close();
