import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 500, height: 400 } });
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005655415.RAW-02.ORIGINAL.jpg", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(500);
  console.log(i, JSON.stringify(await p.evaluate(() => window.__rps())));
}
await b.close();
