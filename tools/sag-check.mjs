import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 840 } });
await p.goto("http://localhost:5173/scarf.html?t=0.62,0.1", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForTimeout(2000);
console.log(JSON.stringify(await p.evaluate(() => window.__scarf.sag())));
await b.close();
