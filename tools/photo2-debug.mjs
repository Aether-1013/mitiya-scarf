import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const mj of [1.6, 1.9, 2.2]) {
  const p = await b.newPage({ viewport: { width: 480, height: 380 } });
  await p.goto(`http://localhost:5173/scarf.html?maxJoint=${mj}&img=/refs/IMG_20261111_005655415.RAW-02.ORIGINAL.jpg`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(1400);
  console.log(`maxJoint=${mj}`, JSON.stringify(await p.evaluate(() => window.__scarf.fingerErr())));
  await p.close();
}
await b.close();
