import { chromium } from "playwright";
const photos = [
  "IMG_20261111_005646414.RAW-02.ORIGINAL.jpg",
  "IMG_20261111_005651691.RAW-02.ORIGINAL.jpg",
  "IMG_20261111_005655415.RAW-02.ORIGINAL.jpg",
  "IMG_20261111_005704566.RAW-02.ORIGINAL.jpg",
  "IMG_20261111_005736828.RAW-02.ORIGINAL.jpg",
];
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const f of photos) {
  const p = await b.newPage({ viewport: { width: 700, height: 900 } });
  p.on("pageerror", e => console.log("ERR", String(e).slice(0,150)));
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/${f}`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() => ({
    g: document.getElementById("hpName").textContent,
    curl: document.getElementById("hpCurl").textContent,
    err: window.__scarf.fingerErr(),
  }));
  console.log(f.slice(6, 20), JSON.stringify(r));
  await p.screenshot({ path: `shots/ref_${f.slice(6, 20)}.png` });
  await p.close();
}
await b.close();
