import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const pick of ["rock","scissors","paper"]) {
  const p = await b.newPage({ viewport: { width: 620, height: 780 } });
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005646414.RAW-02.ORIGINAL.jpg&scarf=${pick}&rpsFast=1&game=1`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForFunction(() => window.__rps().phase === "reveal", { timeout: 30000 }).catch(()=>{});
  await p.waitForTimeout(2800);
  await p.screenshot({ path: `shots/scarf_${pick}.png` });
  await p.close();
}
await b.close();
console.log("ok");
