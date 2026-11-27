import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const url of ["http://localhost:5173/scarf.html?lang=en", "http://localhost:5173/scarf.html?lang=zh&game=1"]) {
  const p = await (await b.newContext({ viewport: { width: 820, height: 900 } })).newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
  await p.waitForTimeout(900);
  const ui = await p.evaluate(() => ({
    title: document.querySelector(".panel h1")?.textContent,
    status: document.getElementById("status")?.textContent,
    modeBtn: document.getElementById("modeBtn")?.textContent,
    langBtn: document.getElementById("langBtn")?.textContent,
    camBtn: document.getElementById("startCam")?.textContent,
    chip0: document.getElementById("chipHint")?.textContent,
    chip1: document.getElementById("chipMode")?.textContent,
    score: document.getElementById("rpsScore")?.textContent,
    start: document.getElementById("rpsStart")?.textContent,
    log: document.querySelector("#logPanel > div")?.textContent?.slice(0, 12),
  }));
  console.log(url.split("?")[1], JSON.stringify(ui, null, 0), "err:", errs[0] ?? "none");
  await p.screenshot({ path: `shots/i18n_${url.includes("lang=en") ? "en" : "zh"}.png` });
  await p.close();
}
await b.close();
