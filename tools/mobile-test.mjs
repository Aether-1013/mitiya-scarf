import { chromium, devices } from "playwright";
const url = "https://miitiya.aether1013.dpdns.org/scarf.html";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ ...devices["iPhone 13"], ignoreHTTPSErrors: false });
const p = await ctx.newPage();
const bad = [];
p.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split("/").pop()}`); });
p.on("pageerror", e => bad.push("JS " + String(e).slice(0,120)));
const t0 = Date.now();
await p.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
console.log("dom", ((Date.now()-t0)/1000).toFixed(1) + "s");
try {
  await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 45000 });
  console.log("ready", ((Date.now()-t0)/1000).toFixed(1) + "s");
} catch { console.log("NOT ready in 45s; status:", await p.textContent("#status").catch(()=>"?")); }
await p.waitForTimeout(1500);
console.log("status:", await p.textContent("#status").catch(()=>"?"));
console.log("errors:", bad.length ? bad.slice(0,5) : "none");
await p.screenshot({ path: "shots/mobile.png" });
await b.close();
