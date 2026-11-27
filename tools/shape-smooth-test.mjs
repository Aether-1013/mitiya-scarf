import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 620, height: 780 } });
const errs = [];
p.on("pageerror", e => errs.push(String(e).slice(0,150)));
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005646414.RAW-02.ORIGINAL.jpg&scarf=rock", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });

// 记录形态随时间的推进，验证"慢速过渡"
const track = [];
for (let i = 0; i < 26; i++) {
  await p.waitForTimeout(220);
  const st = await p.evaluate(() => ({ ph: window.__rps().phase, s: window.__rps().shape }));
  track.push(`${st.ph}:${st.s[0]}`);
}
console.log(track.join(" "));
console.log("errors:", errs.length ? errs[0] : "none");
await b.close();
