import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:3200/", { waitUntil: "networkidle" });
const m = await p.evaluate(() => {
  const nav = document.querySelector("header nav");
  const links = [...nav.querySelectorAll("a")].filter(a => /Desktop|Browser|Lanes|x402|Docs/.test(a.textContent.trim()));
  const n = nav.getBoundingClientRect();
  const l = links[0].getBoundingClientRect(), r = links.at(-1).getBoundingClientRect();
  return { navCentre: +(n.left + n.width / 2).toFixed(1), linksCentre: +((l.left + r.right) / 2).toFixed(1), count: links.length };
});
console.log(m, "offset:", +(m.linksCentre - m.navCentre).toFixed(1), "px");
await b.close();
