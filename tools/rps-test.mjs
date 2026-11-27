import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const cases = [
  ["rock",     "005655415"],  // 握拳
  ["scissors", "005704566"],  // 剪刀
  ["paper",    "005646414"],  // 张开
];
for (const [pick, photo] of cases) {
  const p = await b.newPage({ viewport: { width: 660, height: 860 } });
  const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0,120)));
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/IMG_20261111_${photo}.RAW-02.ORIGINAL.jpg&scarf=${pick}&rpsFast=1&autostart=1`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(4000);
  const st = await p.evaluate(() => ({
    count: document.getElementById("rpsCount").textContent,
    line: document.getElementById("rpsLine").textContent,
    score: document.getElementById("rpsScore").textContent,
    btn: document.getElementById("rpsStart").textContent,
  }));
  console.log(pick, JSON.stringify(st), errs.length ? "ERR " + errs[0] : "no-err");
  await p.screenshot({ path: `shots/rps_${pick}.png` });
  await p.close();
}
await b.close();
