import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"] });
const p = await b.newPage({ viewport: { width: 700, height: 900 }, permissions: ["camera"] });
p.on("pageerror", e => console.log("ERR", String(e)));
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.click("#startCam");
await p.waitForTimeout(6000);
await p.screenshot({ path: "shots/hp_live.png" });
console.log(await p.evaluate(() => JSON.stringify({
  on: document.getElementById("handPreviewWrap").className,
  name: document.getElementById("hpName").textContent,
  status: document.getElementById("status").textContent,
})));
await b.close();
