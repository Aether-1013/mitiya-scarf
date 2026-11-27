import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
// 录屏模式支持横向偏移：?reel=1&reelx=0.45 让围巾整体靠右
s = s.replace(`  if (reel) {
    // 缓慢的 8 字运镜，让围巾自己游动
    const t = clock.getElapsedTime();
    targetNdc.set(Math.sin(t * 0.5) * 0.26, 0.3 + Math.sin(t * 0.85) * 0.1);
  }`,
`  if (reel) {
    // 缓慢的 8 字运镜，让围巾自己游动；reelx 可整体右移构图
    const t = clock.getElapsedTime();
    targetNdc.set(reelX + Math.sin(t * 0.5) * 0.18, 0.3 + Math.sin(t * 0.85) * 0.08);
  }`);
s = s.replace(`const reel = params.has("reel"); // 宣传片录屏模式：干净画面 + 自动运镜`,
`const reel = params.has("reel"); // 宣传片录屏模式：干净画面 + 自动运镜
const reelX = Number(params.get("reelx") ?? "0"); // 构图横向偏移`);
fs.writeFileSync(p, s, "utf8");
console.log("reelx:", s.includes("const reelX"));
