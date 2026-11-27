import { chromium } from "playwright";
const urls = ["https://mitiya.pages.dev/scarf.html", "https://mitiya.pages.dev/"];
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const u of urls) {
  const ctx = await b.newContext({ viewport: { width: 700, height: 900 } });
  const p = await ctx.newPage();
  const bad = [];
  p.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split("/").pop()}`); });
  p.on("pageerror", e => bad.push("JS " + String(e).slice(0,100)));
  const t0 = Date.now();
  await p.goto(u, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (u.endsWith("/scarf.html")) {
    await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
    console.log(u, "ready", ((Date.now()-t0)/1000).toFixed(1)+"s", "| status:", await p.textContent("#status"));
    await p.waitForTimeout(1200);
    await p.screenshot({ path: "shots/pages_live.png" });
  } else {
    console.log(u, "->", p.url());
  }
  console.log("  err:", bad.length ? bad.slice(0,3) : "none");
  await ctx.close();
}
await b.close();
