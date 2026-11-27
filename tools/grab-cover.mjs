import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
// B 站封面 16:10 = 1146x717，这里按 1280x800 出图再缩放
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await p.goto("file:///C:/Users/Aether/Documents/code/Mitiya/shots/cover.html");
await p.waitForTimeout(900);
await p.screenshot({ path: "shots/cover_1280x800.png", clip: { x: 0, y: 0, width: 1280, height: 800 } });
await b.close();
console.log("cover saved");
