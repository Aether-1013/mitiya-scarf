import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 620, height: 820 } });
p.on("console", m => { const t = m.text(); if (!t.includes("[vite]")) console.log(t.slice(0, 220)); });
await p.goto("http://localhost:5173/scarf.html?t=0.2,0.45", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForTimeout(2000);
const r = await p.evaluate(() => {
  const s = window.__scarf;
  const c = s.chain;
  const nan = c.ang.filter(v => !Number.isFinite(v)).length;
  return {
    n: c.bones.length,
    names: c.bones.map(b => b.name).slice(0, 20),
    len: +c.length.toFixed(2),
    ang: c.ang.slice(0, 8).map(v => +v.toFixed(3)),
    nan,
    seg: c.seg.slice(0, 8).map(v => +v.toFixed(2)),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
