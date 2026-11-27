import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 840 } });
p.on("pageerror", e => console.log("ERR", String(e)));
await p.goto("http://localhost:5173/scarf.html?t=0.55,0.15", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForTimeout(2000);
for (const [x,y] of [[0.55,0.15],[-0.55,0.2],[0.0,0.55]]) {
  await p.mouse.move(320 + x*300, 420 - y*340);
  await p.waitForTimeout(1300);
  console.log(JSON.stringify(await p.evaluate(() => window.__scarf.probe())));
}
await p.screenshot({ path: "shots/d2.png" });
await b.close();
