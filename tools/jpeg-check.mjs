import { chromium } from "playwright";
import fs from "node:fs";
const dir = "public/refs";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto("http://localhost:5173/scarf.html?t=0,0", { waitUntil: "load" });
for (const f of fs.readdirSync(dir)) {
  const ok = await p.evaluate(async (u) => {
    const img = new Image();
    img.src = u;
    try { await img.decode(); return `${img.naturalWidth}x${img.naturalHeight}`; } catch { return "FAIL"; }
  }, "/refs/" + f);
  console.log(f.slice(6, 20), ok);
}
await b.close();
