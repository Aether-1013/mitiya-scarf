import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 520, height: 420 } });
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005646414.RAW-02.ORIGINAL.jpg&scarf=paper", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
// 采样一根须子骨的朝向变化，验证过渡不是瞬切
const samples = [];
for (let i = 0; i < 14; i++) {
  await p.waitForTimeout(180);
  const q = await p.evaluate(() => {
    const f = window.__scarf.fingers[0];
    const qq = f.bones[0].quaternion;
    return [qq.x, qq.y, qq.z, qq.w].map(v => +v.toFixed(3));
  });
  samples.push(q.map(v => v.toFixed(2)).join(","));
}
console.log(samples.join(" | "));
await b.close();
