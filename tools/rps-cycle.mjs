import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 520, height: 420 } });
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005655415.RAW-02.ORIGINAL.jpg&reveal=0.4", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
const seen = new Set();
for (let i = 0; i < 16; i++) {
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({ ph: window.__rps().phase, sc: document.getElementById("rpsScore").textContent }));
  seen.add(r.ph);
  if (i % 4 === 3) console.log(i, JSON.stringify(r));
}
console.log("phases seen:", [...seen].join(","));
await b.close();
