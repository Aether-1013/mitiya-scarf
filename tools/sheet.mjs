import { chromium } from "playwright";
import fs from "node:fs";
const frames = ["f001","f055","f110","f165","f220","f265"].filter(f => fs.existsSync(`shots/frames/${f}.png`));
const html = `<html><body style="margin:0;background:#05030c;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;width:990px">
${frames.map((f,i)=>`<div style="position:relative"><img src="file:///C:/Users/Aether/Documents/code/Mitiya/shots/frames/${f}.png" style="width:100%;display:block;border-radius:8px"><span style="position:absolute;left:8px;top:6px;font:11px system-ui;color:#a87bff">${['0.0s','2.2s','4.4s','6.6s','8.8s','10.6s'][i]}</span></div>`).join("")}
</body></html>`;
fs.writeFileSync("shots/sheet.html", html, "utf8");
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1002, height: 900 }, deviceScaleFactor: 1 });
await p.goto("file:///C:/Users/Aether/Documents/code/Mitiya/shots/sheet.html");
await p.waitForTimeout(600);
await p.screenshot({ path: "shots/motion_sheet.png", fullPage: true });
await b.close();
console.log("ok", frames.join(","));
