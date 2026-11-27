import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
await p.goto("http://localhost:5173/scarf.html?reel=1&reelx=0.62", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(5200);
await p.screenshot({ path: "shots/cover_src.png" });
await b.close();
console.log("new src captured with scarf on the right");
