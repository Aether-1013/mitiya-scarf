import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 700, height: 900 } });
p.on("pageerror", e => console.log("ERR", String(e).slice(0,200)));
p.on("console", m => { const t = m.text(); if (/GESTURE|ERR|photo|照片/.test(t)) console.log(t.slice(0,200)); });
await p.goto("http://localhost:5173/scarf.html?img=/refs/IMG_20261111_005651691.RAW-02.ORIGINAL.jpg", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
await p.waitForTimeout(2500);
const st = await p.evaluate(() => ({
  status: document.getElementById("status").textContent,
  gesture: document.getElementById("hpName").textContent,
  curl: document.getElementById("hpCurl").textContent,
}));
console.log(JSON.stringify(st));
await p.screenshot({ path: "shots/img_mode.png" });
await b.close();
