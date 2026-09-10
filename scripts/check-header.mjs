import { chromium } from "playwright-core";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://kleeto.fun/demo", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(7000);
const t = await p.evaluate(() => ({
  header: document.querySelector("header")?.innerText.replace(/\n+/g, " · "),
  listGone: !document.body.innerText.includes("the line") && !document.body.innerText.includes("Person 1"),
}));
console.log("header:", t.header);
console.log("job list removed:", t.listGone);
await b.close();
