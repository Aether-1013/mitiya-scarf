import { chromium } from "playwright";
const imgs = ["005646414","005651691","005655415","005704566","005736828"];
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const n of imgs) {
  const p = await b.newPage({ viewport: { width: 480, height: 360 } });
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/IMG_20261111_${n}.RAW-02.ORIGINAL.jpg`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(1200);
  console.log(n, JSON.stringify(await p.evaluate(() => window.__scarf.hand())));
  await p.close();
}
await b.close();
