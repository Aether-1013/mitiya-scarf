import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 760, height: 900 } })).newPage();
await p.goto("https://mitiya.aether1013.dpdns.org/scarf.html", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
const mid = await p.evaluate(() => ({
  pct: document.getElementById("loadpct")?.textContent,
  hint: document.querySelector(".gate-hint")?.textContent?.slice(0, 40),
}));
console.log("加载中:", JSON.stringify(mid));
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
console.log("就绪 ✓");
await b.close();
