import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
const info = await p.evaluate(() => {
  const v = document.querySelector("video[poster]");
  const dots = [...v.closest("div").parentElement.querySelectorAll("span")]
    .map(s => getComputedStyle(s).backgroundColor)
    .filter(c => /rgb\(2[0-9]{2}|rgb\(255/.test(c));
  return { src: v.currentSrc || v.querySelector("source")?.src, dots: dots.slice(0, 3) };
});
console.log(info);
await b.close();
