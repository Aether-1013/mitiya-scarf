import { chromium } from "playwright";
import fs from "node:fs";
const pairs = [
  ["005646414","mj19_414"],["005651691","mj19_691"],["005655415","mj19_415"],["005704566","mj19_566"],["005736828","mj19_828"],
];
const rows = pairs.map(([ref, ren]) => `
  <div style="display:flex;gap:8px;margin-bottom:8px">
    <figure style="margin:0"><img src="file:///C:/Users/Aether/Documents/code/Mitiya/public/refs/IMG_20261111_${ref}.RAW-02.ORIGINAL.jpg" style="width:330px;display:block;border-radius:6px">
      <figcaption style="font:12px system-ui;color:#888">参考 ${ref}</figcaption></figure>
    <figure style="margin:0"><img src="file:///C:/Users/Aether/Documents/code/Mitiya/shots/${ren}.png" style="width:330px;display:block;border-radius:6px">
      <figcaption style="font:12px system-ui;color:#888">围巾渲染</figcaption></figure>
  </div>`).join("");
fs.writeFileSync("shots/compare.html", `<html><body style="margin:0;background:#0b0715;padding:10px">${rows}</body></html>`);
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 720, height: 1400 } });
await p.goto("file:///C:/Users/Aether/Documents/code/Mitiya/shots/compare.html");
await p.waitForTimeout(800);
await p.screenshot({ path: "shots/compare.png", fullPage: true });
await b.close();
console.log("compare.png ok");
