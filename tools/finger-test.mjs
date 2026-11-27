import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
async function measure(curl) {
  const p = await b.newPage({ viewport: { width: 620, height: 820 } });
  await p.goto(`http://localhost:5173/scarf.html?t=0.35,0.15&curl=${curl}`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const s = window.__scarf;
    return {
      n: s.fingers.length,
      state: s.state.map(v => +v.toFixed(3)),
      tips: [0,1,2,3].map(i => s.tip(i).map(v => +v.toFixed(3))),
    };
  });
  await p.close();
  return r;
}
const a = await measure(0);
const c = await measure(1);
console.log("curl=0", JSON.stringify(a));
console.log("curl=1", JSON.stringify(c));
for (let i = 0; i < 4; i++) {
  const dx = c.tips[i][0]-a.tips[i][0], dy = c.tips[i][1]-a.tips[i][1], dz = c.tips[i][2]-a.tips[i][2];
  console.log(`finger ${i}: Δ=(${dx.toFixed(3)}, ${dy.toFixed(3)}, ${dz.toFixed(3)})  |Δ|=${Math.hypot(dx,dy,dz).toFixed(3)}`);
}
await b.close();
