import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 900 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send("Network.enable");
// 限速到 150KB/s，模拟慢网
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 150 * 1024, uploadThroughput: 100 * 1024 });
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "domcontentloaded", timeout: 120000 });
const samples = [];
for (let i = 0; i < 9; i++) {
  await p.waitForTimeout(2000);
  const st = await p.evaluate(() => ({
    bar: document.getElementById("loadbar")?.style.width,
    pct: document.getElementById("loadpct")?.textContent,
    msg: document.getElementById("loadmsg")?.textContent,
    hint: document.querySelector(".gate-hint")?.textContent?.slice(0, 30),
  }));
  samples.push(st);
  if (i === 1) await p.screenshot({ path: "shots/fakebar_early.png" });
}
console.log(samples.map(s => `${s.pct} | ${s.msg}`).join("\n"));
console.log("hint:", samples[0].hint);
await b.close();
