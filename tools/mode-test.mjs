import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 820 } });
const errs = [];
p.on("pageerror", e => errs.push(String(e).slice(0,150)));

// 默认（动捕模式）
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005704566.RAW-02.ORIGINAL.jpg", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
await p.waitForTimeout(2200);
console.log("默认:", await p.textContent("#status"), "| rps可见:", await p.evaluate(() => getComputedStyle(document.getElementById("rps")).display));
await p.screenshot({ path: "shots/mode_mirror.png" });

// 点按钮切猜拳
await p.click("#modeBtn");
await p.waitForTimeout(1500);
console.log("切换后:", await p.textContent("#status"), "| rps可见:", await p.evaluate(() => getComputedStyle(document.getElementById("rps")).display));
await p.screenshot({ path: "shots/mode_game.png" });
console.log("errors:", errs.length ? errs[0] : "none");
await b.close();
