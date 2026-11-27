import { chromium } from "playwright";
import fs from "node:fs";
const map = {
  rock: "005655415",     // 握拳
  scissors: "005704566", // 剪刀
  paper: "005646414",    // 张开
};
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = {};
for (const [k, photo] of Object.entries(map)) {
  const p = await b.newPage({ viewport: { width: 420, height: 320 } });
  await p.goto(`http://localhost:5173/scarf.html?img=/refs/IMG_20261111_${photo}.RAW-02.ORIGINAL.jpg`, { waitUntil: "load" });
  await p.waitForFunction(() => document.body.dataset.imgReady === "1", { timeout: 60000 });
  await p.waitForTimeout(1500);
  out[k] = await p.evaluate(() => ({ gesture: window.__scarf.hand().g, dirs: window.__scarf.fingerDirs() }));
  console.log(k, out[k].gesture, JSON.stringify(out[k].dirs[1]?.[0]));
  await p.close();
}
await b.close();
fs.writeFileSync("poses.json", JSON.stringify(out, null, 1), "utf8");
console.log("written poses.json");
