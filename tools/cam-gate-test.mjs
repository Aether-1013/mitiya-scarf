import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 900 }, permissions: ["camera"] });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 60, downloadThroughput: 300 * 1024, uploadThroughput: 200 * 1024 });
p.on("pageerror", e => console.log("ERR", String(e).slice(0,120)));
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 120000 });
await p.waitForTimeout(600);
await p.click("#startCam");
await p.waitForTimeout(1500);
const st = await p.evaluate(() => ({
  hidden: document.getElementById("gate").classList.contains("hide"),
  kicker: document.querySelector(".gate-kicker")?.textContent,
  title: document.querySelector("#gate h2")?.textContent,
  pct: document.getElementById("loadpct")?.textContent,
  msg: document.getElementById("loadmsg")?.textContent,
  hint: document.querySelector(".gate-hint")?.textContent,
}));
console.log("摄像头初始化时:", JSON.stringify(st));
await p.screenshot({ path: "shots/cam_gate.png" });
await p.waitForTimeout(12000);
const after = await p.evaluate(() => ({ hidden: document.getElementById("gate").classList.contains("hide"), status: document.getElementById("status")?.textContent }));
console.log("初始化后:", JSON.stringify(after));
await b.close();
