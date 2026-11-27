import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 录屏模式：?reel=1 —— 隐藏一切 UI、合成手自动摆动、镜头缓慢游走
s = s.replace("const hpDemo = params.has(\"hpDemo\");",
`const hpDemo = params.has("hpDemo");
const reel = params.has("reel"); // 宣传片录屏模式：干净画面 + 自动运镜
if (reel) {
  document.getElementById("logPanel")?.remove();
  for (const sel of [".chips", "#rpsScore", "#rpsStart", ".credit", "#gate"]) {
    document.querySelectorAll(sel).forEach((el) => ((el as HTMLElement).style.display = "none"));
  }
}`);

// 循环里：录屏模式用合成手 + 自动运镜
s = s.replace(`  } else if (hpDemo) {
    hand = demoHand(clock.getElapsedTime());
    drawPreview();
    fingerTargets = [hand.curl, hand.curl, hand.curl, hand.curl, hand.curl];`,
`  } else if (hpDemo || reel) {
    hand = demoHand(clock.getElapsedTime());
    if (!reel) drawPreview();
    fingerTargets = [hand.curl, hand.curl, hand.curl, hand.curl, hand.curl];`);

s = s.replace(`  raycaster.setFromCamera(targetNdc, camera);`,
`  if (reel) {
    // 缓慢的 8 字运镜，让围巾自己游动
    const t = clock.getElapsedTime();
    targetNdc.set(Math.sin(t * 0.55) * 0.42, 0.36 + Math.sin(t * 0.92) * 0.16);
  }
  raycaster.setFromCamera(targetNdc, camera);`);

fs.writeFileSync(p, s, "utf8");
console.log("reel:", s.includes("const reel = params.has"));
