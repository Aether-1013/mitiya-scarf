import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", args: [
  "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader",
  "--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream" ] });
const page = await browser.newPage({ viewport: { width: 640, height: 900 }, permissions: ["camera"] });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto("http://localhost:5173/scarf.html", { waitUntil: "load" });
await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await page.click("#startCam");
await page.waitForTimeout(12000);
const s = await page.evaluate(() => ({
  status: document.getElementById("status").textContent,
  cam: (document.getElementById("cam")).videoWidth + "x" + (document.getElementById("cam")).videoHeight,
  fmt: (document.getElementById("cam")).readyState,
}));
console.log("STATE", JSON.stringify(s));
console.log("ERRORS", errs.length ? errs.slice(0,6).join(" | ") : "none");
await browser.close();
