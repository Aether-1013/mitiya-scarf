import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 620, height: 820 } });
p.on("pageerror", e => console.log("ERR", String(e)));
p.on("console", m => { const t=m.text(); if (t.startsWith("ERR")||t.includes("TypeError")) console.log(t.slice(0,200)); });
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForTimeout(1500);

// 把指针移到几个位置，读末端误差
const targets = [[0.45,0.2],[-0.5,0.3],[0.1,-0.6],[0.0,0.75]];
for (const [x,y] of targets) {
  await p.mouse.move(320 + x*280, 430 - y*330);
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => window.__scarf.probe());
  console.log(`ndc(${x},${y}) -> tip=${JSON.stringify(r.tip)} err=${r.err}`);
}
await p.screenshot({ path: "shots/ik_check.png" });
await b.close();
