import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 840 } });
await p.goto("http://localhost:5173/scarf.html?t=0.55,0.15", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const s = window.__scarf;
  const c = s.chain;
  const last = c.bones[c.bones.length - 1];
  const mw = new (last.matrixWorld.constructor)();
  mw.copy(last.matrixWorld);
  return {
    n: c.bones.length,
    names: c.bones.map(b => b.name),
    lastBoneWorld: [mw.elements[12], mw.elements[13], mw.elements[14]].map(v => +v.toFixed(2)),
    localQ: last.quaternion.toArray().map(v => +v.toFixed(3)),
    probe: s.probe(),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
