import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 840 } });
await p.goto("http://localhost:5173/scarf.html?t=-0.75,0.05", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const s = window.__scarf, c = s.chain;
  const pos = c.bones.map(b => { const m = b.matrixWorld.elements; return [m[12], m[13], m[14]]; });
  const A = pos[0], B = pos[pos.length - 1];
  const ab = [B[0]-A[0], B[1]-A[1], B[2]-A[2]];
  const len = Math.hypot(...ab);
  const dev = pos.map(P => {
    const ap = [P[0]-A[0], P[1]-A[1], P[2]-A[2]];
    const t = (ap[0]*ab[0]+ap[1]*ab[1]+ap[2]*ab[2]) / (len*len);
    const foot = [A[0]+ab[0]*t, A[1]+ab[1]*t, A[2]+ab[2]*t];
    return +Math.hypot(P[0]-foot[0], P[1]-foot[1], P[2]-foot[2]).toFixed(2);
  });
  return { pos: pos.map(p => p.map(v => +v.toFixed(2))), deviate: dev, probe: s.probe() };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
