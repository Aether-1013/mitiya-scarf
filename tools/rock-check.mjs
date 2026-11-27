import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 620, height: 780 } });
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005646414.RAW-02.ORIGINAL.jpg&scarf=rock&rpsFast=1&game=1", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
await p.waitForTimeout(3000);
await p.screenshot({ path: "shots/rock_fixed.png" });
await b.close();
console.log("ok");
