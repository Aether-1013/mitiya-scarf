import { chromium } from "playwright";
import fs from "node:fs";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({
  viewport: { width: 1600, height: 900 },
  recordVideo: { dir: "shots/reel", size: { width: 1600, height: 900 } },
});
const p = await ctx.newPage();
await p.goto("http://localhost:5173/scarf.html?reel=1", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(1200);
// 录 20 秒
const frames = [];
for (let i = 0; i < 10; i++) {
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `shots/reel_f${i}.png` });
}
const v = p.video();
await ctx.close();
await b.close();
const src = await v.path();
fs.copyFileSync(src, "shots/reel_draft.webm");
console.log("saved shots/reel_draft.webm", (fs.statSync("shots/reel_draft.webm").size/1024/1024).toFixed(1) + " MB");
