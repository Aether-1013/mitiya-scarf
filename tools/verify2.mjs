import { chromium } from "playwright";
const url = "https://[2602:fa59:2:62a2::1]:8443/scarf.html";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 700, height: 900 } });
const p = await ctx.newPage();
p.on("console", m => { const t = m.text(); if (/CHAIN|SCARF|CULL|error|Error/.test(t)) console.log("[c]", t.slice(0,160)); });
await p.goto(url, { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.mouse.move(420, 380);
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const c = document.getElementById("stage3d");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  let nonBlack = 0;
  if (gl) {
    const w = 60, h = 60;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(c.width/2 - w/2, c.height/2 - h/2, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    for (let i = 0; i < px.length; i += 4) if (px[i] + px[i+1] + px[i+2] > 30) nonBlack++;
  }
  return { size: `${c.width}x${c.height}`, nonBlack, err: window.__scarf ? "hook-ok" : "no-hook" };
});
console.log(JSON.stringify(info));
await p.screenshot({ path: "shots/deployed2.png" });
await b.close();
