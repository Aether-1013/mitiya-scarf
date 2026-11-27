import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 520, height: 420 } });
const errs = [];
p.on("pageerror", e => errs.push(String(e).slice(0,150)));
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005655415.RAW-02.ORIGINAL.jpg", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
const snaps = [];
for (let i = 0; i < 12; i++) {
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({
    phase: window.__rps().phase,
    score: document.getElementById("rpsScore").textContent,
    line: document.getElementById("rpsLine").textContent,
  }));
  snaps.push(r);
}
console.log(snaps.map(s => `${s.phase}|${s.score}`).join("  "));
console.log("last line:", snaps[snaps.length-1].line);
console.log("errors:", errs.length ? errs[0] : "none");
await b.close();
