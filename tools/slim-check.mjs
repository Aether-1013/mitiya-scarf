import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 700, height: 900 } });
const p = await ctx.newPage();
const bad = [];
p.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split("/").pop()}`); });
p.on("pageerror", e => bad.push("JS " + String(e).slice(0,100)));
await p.goto("http://localhost:4173/scarf.html", { waitUntil: "load", timeout: 60000 }).catch(async () => {
  await p.goto("http://localhost:5173/scarf.html", { waitUntil: "load", timeout: 60000 });
});
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(1500);
console.log("status:", await p.textContent("#status"), "| err:", bad.length ? bad.slice(0,3) : "none");
await p.screenshot({ path: "shots/slim_check.png" });
await b.close();
