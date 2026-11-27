import { chromium } from "playwright";
const imgs = ["005646414","005651691","005655415","005704566","005736828"];
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const name of imgs) {
  const p = await b.newPage({ viewport: { width: 640, height: 820 }, deviceScaleFactor: 1 });
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/IMG_20261111_${name}.RAW-02.ORIGINAL.jpg`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `shots/final_${name}.png` });
  await p.close();
}
await b.close();
console.log("done");
