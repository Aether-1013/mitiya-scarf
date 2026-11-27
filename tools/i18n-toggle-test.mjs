import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 820, height: 900 } })).newPage();
const errs = [];
p.on("pageerror", e => errs.push(String(e).slice(0,150)));
await p.goto("http://localhost:5173/scarf.html?lang=en", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(700);
const read = () => p.evaluate(() => ({
  title: document.querySelector(".panel h1")?.textContent,
  mode: document.getElementById("modeBtn")?.textContent,
  lang: document.getElementById("langBtn")?.textContent,
  cam: document.getElementById("startCam")?.textContent,
  chip: document.getElementById("chipHint")?.textContent,
  score: document.getElementById("rpsScore")?.textContent,
  log: document.querySelector("#logPanel > div")?.textContent?.slice(0,6),
}));
console.log("EN  :", JSON.stringify(await read()));
await p.click("#langBtn");
await p.waitForTimeout(500);
console.log("点切换:", JSON.stringify(await read()));
await p.screenshot({ path: "shots/i18n_toggle.png" });
console.log("err:", errs[0] ?? "none");
await b.close();
