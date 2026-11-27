import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 760, height: 900 } })).newPage();
await p.goto("https://mitiya.pages.dev/scarf.html", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
const st = await p.evaluate(() => ({
  hint: document.querySelector(".gate-hint")?.textContent ?? null,
  hasPct: !!document.getElementById("loadpct"),
  pct: document.getElementById("loadpct")?.textContent ?? null,
  msg: document.getElementById("loadmsg")?.textContent ?? null,
}));
console.log(JSON.stringify(st));
await p.screenshot({ path: "shots/pages_now.png" });
await b.close();
