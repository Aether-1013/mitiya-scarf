import { chromium } from "playwright";
const imgs = ["005646414","005651691","005655415","005704566","005736828"];
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const name of imgs) {
  const p = await b.newPage({ viewport: { width: 640, height: 820 } });
  await p.goto(`http://localhost:5173/scarf.html?maxJoint=1.9&img=/refs/IMG_20261111_${name}.RAW-02.ORIGINAL.jpg`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(1800);
  const e = await p.evaluate(() => window.__scarf.fingerErr());
  console.log(name, JSON.stringify(e));
  await p.screenshot({ path: `shots/mj19_${name.slice(6)}.png` });
  await p.close();
}
await b.close();
