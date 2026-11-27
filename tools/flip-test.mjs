import { chromium } from "playwright";
const img = "/refs/IMG_20261111_005651691.RAW-02.ORIGINAL.jpg";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const q of ["", "?flipS=1", "?flipU=1", "?flipS=1&flipU=1"]) {
  const p = await b.newPage({ viewport: { width: 500, height: 400 } });
  const sep = q ? "&" : "?";
  await p.goto(`http://localhost:5173/scarf.html${q}${sep}img=${img}`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(1500);
  const e = await p.evaluate(() => window.__scarf.fingerErr());
  console.log(`[${q || "none"}]`, JSON.stringify(e));
  await p.close();
}
await b.close();
