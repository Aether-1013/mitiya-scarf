import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 760, height: 900 } })).newPage();
const t0 = Date.now();
await p.goto("https://mitiya.pages.dev/scarf.html", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
const mid = await p.evaluate(() => ({
  hint: document.querySelector(".gate-hint")?.textContent ?? null,
  pct: document.getElementById("loadpct")?.textContent ?? null,
  msg: document.getElementById("loadmsg")?.textContent ?? null,
}));
await p.screenshot({ path: "shots/pages_new.png" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
console.log("加载中:", JSON.stringify(mid));
console.log("就绪用时:", ((Date.now()-t0)/1000).toFixed(1) + "s");
console.log("log 面板存在:", await p.evaluate(() => !!document.getElementById("logPanel")));
await b.close();
