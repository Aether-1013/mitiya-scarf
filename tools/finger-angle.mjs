import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
async function m(curl) {
  const p = await b.newPage({ viewport: { width: 620, height: 820 } });
  await p.goto(`http://localhost:5173/scarf.html?t=0.35,0.15&curl=${curl}`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const s = window.__scarf;
    return { state: s.state.map(v => +v.toFixed(2)), bends: [0,1,2,3].map(i => s.bend(i)) };
  });
  await p.close();
  return r;
}
console.log("curl=0", JSON.stringify(await m(0)));
console.log("curl=1", JSON.stringify(await m(1)));
await b.close();
