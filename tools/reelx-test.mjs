import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const x of ["0", "0.3", "0.45", "0.6"]) {
  const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await p.goto(`http://localhost:5173/scarf.html?reel=1&reelx=${x}`, { waitUntil: "load", timeout: 60000 });
  await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
  await p.waitForTimeout(4000);
  const probe = await p.evaluate(() => window.__scarf.probe ? window.__scarf.probe() : null);
  console.log(`reelx=${x}`, "tip=", JSON.stringify(probe?.tip?.map(v => +v.toFixed(1))), "goal=", JSON.stringify(probe?.goal?.map(v => +v.toFixed(1))));
  await p.screenshot({ path: `shots/reelx_${x}.png` });
  await p.close();
}
await b.close();
