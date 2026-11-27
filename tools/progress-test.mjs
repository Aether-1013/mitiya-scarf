import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 900 } });
const p = await ctx.newPage();
// 限速，让进度条停在中间好截图
const cdp = await ctx.newCDPSession(p);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 80, downloadThroughput: 400 * 1024, uploadThroughput: 200 * 1024 });
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "domcontentloaded", timeout: 90000 });
const shots = [];
for (let i = 0; i < 14; i++) {
  await p.waitForTimeout(700);
  const st = await p.evaluate(() => {
    const bar = document.getElementById("loadbar");
    return { w: bar ? bar.style.width : "?", msg: document.getElementById("loadmsg")?.textContent, pct: document.getElementById("loadpct")?.textContent };
  });
  shots.push(st);
  if (i === 2 || i === 5) await p.screenshot({ path: `shots/progress_${i}.png` });
  if (st.msg === "就绪") break;
}
console.log(shots.map(s => `${s.pct} ${s.msg}`).join("\n"));
await b.close();
