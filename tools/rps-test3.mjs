import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const cases = [
  ["005655415", "scissors", "石头"],
  ["005704566", "paper",    "剪刀"],
  ["005646414", "rock",     "布"],
];
for (const [photo, scarf, label] of cases) {
  const p = await b.newPage({ viewport: { width: 660, height: 860 } });
  const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0,120)));
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/IMG_20261111_${photo}.RAW-02.ORIGINAL.jpg&scarf=${scarf}&rpsFast=1`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForFunction(() => window.__rps().phase === "reveal", { timeout: 30000 }).catch(()=>{});
  await p.waitForTimeout(900);
  const st = await p.evaluate(() => window.__rps());
  console.log(label, JSON.stringify(st), errs.length ? "ERR " + errs[0] : "no-err");
  await p.screenshot({ path: `shots/rps3_${label}.png` });
  await p.close();
}
await b.close();
