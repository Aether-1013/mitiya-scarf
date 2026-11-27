import { chromium } from "playwright";
const imgs = ["005651691","005655415","005704566","005736828","005646414"];
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const mj of [0.85, 1.2, 1.6]) {
  const line = [];
  for (const name of imgs) {
    const p = await b.newPage({ viewport: { width: 480, height: 380 } });
    await p.goto(`http://localhost:5173/scarf.html?maxJoint=${mj}&img=/refs/IMG_20261111_${name}.RAW-02.ORIGINAL.jpg`, { waitUntil: "load" });
    await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
    await p.waitForTimeout(1400);
    const e = await p.evaluate(() => window.__scarf.fingerErr());
    line.push(e.reduce((a,b)=>a+b,0)/e.length);
    await p.close();
  }
  console.log(`maxJoint=${mj}`, line.map(v => v.toFixed(0)).join(" / "));
}
await b.close();
