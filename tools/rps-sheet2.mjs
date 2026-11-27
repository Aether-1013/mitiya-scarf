import { chromium } from "playwright";
import fs from "node:fs";
const items = [["rock","石头","布"],["scissors","剪刀","布"],["paper","布","布"]];
const cells = items.map(([k,cn,player]) => `
  <figure style="margin:0">
    <img src="file:///C:/Users/Aether/Documents/code/Mitiya/shots/scarf_${k}.png" style="width:300px;display:block;border-radius:8px">
    <figcaption style="font:13px system-ui;color:#cfc2e6;padding:6px 2px;line-height:1.5">
      围巾出 <b style="color:#a87bff">${cn}</b>（回放照片姿态）<br>
      <span style="color:#8f83a8">玩家小窗：出${player}</span>
    </figcaption>
  </figure>`).join("");
fs.writeFileSync("shots/rps_sheet.html",
`<html><body style="margin:0;background:#0b0715;padding:12px;display:flex;gap:10px">${cells}</body></html>`);
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 960, height: 900 } });
await p.goto("file:///C:/Users/Aether/Documents/code/Mitiya/shots/rps_sheet.html");
await p.waitForTimeout(700);
await p.screenshot({ path: "shots/rps_sheet.png", fullPage: true });
await b.close();
console.log("sheet rebuilt with captions");
