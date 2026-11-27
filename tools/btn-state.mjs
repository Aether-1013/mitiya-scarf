import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"] });
const p = await b.newPage({ viewport: { width: 640, height: 900 }, permissions: ["camera"] });
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.click("#startCam");
await p.waitForTimeout(4000);
console.log(await p.evaluate(() => JSON.stringify({
  btn: document.getElementById("startCam").textContent,
  disabled: document.getElementById("startCam").disabled,
  status: document.getElementById("status").textContent,
})));
await b.close();
