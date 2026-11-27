import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 620, height: 780 } });
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005646414.RAW-02.ORIGINAL.jpg&scarf=rock&reveal=0.3", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
const shots = [];
for (let round = 1; round <= 3; round++) {
  await p.waitForFunction((r) => window.__rps().phase === "reveal", { timeout: 20000 }).catch(()=>{});
  await p.waitForTimeout(400);
  const sc = await p.evaluate(() => document.getElementById("rpsScore").textContent);
  await p.screenshot({ path: `shots/rps_round${round}.png` });
  shots.push(sc);
  // 等这一局结束，进入下一局
  await p.waitForFunction(() => window.__rps().phase !== "reveal", { timeout: 20000 }).catch(()=>{});
  await p.waitForTimeout(200);
}
console.log(shots.join("  ->  "));
await b.close();
