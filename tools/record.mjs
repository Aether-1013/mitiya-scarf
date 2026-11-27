import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({
  viewport: { width: 640, height: 860 },
  recordVideo: { dir: "shots/video", size: { width: 640, height: 860 } },
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("ERR", String(e)));
await page.goto("http://localhost:5173/scarf.html", { waitUntil: "load" });
await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await page.waitForTimeout(1500);

const cx = 320, cy = 430;
const pts = [];
for (let i = 0; i < 26; i++) {
  const t = i / 26;
  pts.push([cx + Math.sin(t * Math.PI * 2) * 190, cy - 170 + Math.cos(t * Math.PI * 2) * 110]);
}
for (let i = 0; i < 26; i++) {
  const t = i / 26;
  pts.push([cx + Math.sin(t * Math.PI * 3 + 1) * 130, cy + 60 - t * 240]);
}

for (const [x, y] of pts) {
  await page.mouse.move(x, y);
  await page.waitForTimeout(110);
}
// 按一下模拟握拳
await page.mouse.move(cx, cy - 60);
await page.mouse.down();
await page.waitForTimeout(1200);
await page.mouse.up();
await page.waitForTimeout(900);

const video = page.video();
await ctx.close();
await browser.close();

const p = await video.path();
const out = "shots/scarf_motion.webm";
fs.copyFileSync(p, out);
console.log("saved", out, (fs.statSync(out).size / 1024).toFixed(0) + " KB");
