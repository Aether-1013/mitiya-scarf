import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await p.goto("file:///C:/Users/Aether/Documents/code/Mitiya/shots/cover_yt.html");
await p.waitForTimeout(900);
await p.screenshot({ path: "shots/cover_yt_2560x1440.png" });
await b.close();
console.log("rendered");
