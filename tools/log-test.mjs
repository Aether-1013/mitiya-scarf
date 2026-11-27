import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", e => console.log("ERR", String(e).slice(0,120)));
await p.goto("http://localhost:5173/scarf.html", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(1500);
// 展开日志面板
await p.evaluate(() => {
  const head = document.querySelector("#logPanel > div");
  head && head.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await p.waitForTimeout(400);
const lines = await p.evaluate(() => [...document.querySelectorAll("#logPanel > div:nth-child(2) > div")].map(d => d.textContent));
console.log("日志行数:", lines.length);
console.log(lines.slice(0, 12).join("\n"));
await p.screenshot({ path: "shots/log_panel.png" });
await b.close();
