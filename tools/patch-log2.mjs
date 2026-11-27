import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 启动时打印环境
s = s.replace('log("开始加载模型 MItya.pmx（3.7 MB）");',
`logPanel.logEnv({ 构建: "pages/" + (location.host.includes("pages.dev") ? "cloudflare" : "local") });
log("开始加载模型 MItya.pmx（3.7 MB）");`);

// 首帧检测结果（只打一次）
s = s.replace(`    gestureCurl += (hand.curl - gestureCurl) * Math.min(1, dt * 8);
    drawPreview();`,
`    if (hand.present && !firstHandLogged) {
      firstHandLogged = true;
      log("检测到手 ✓", "ok");
    } else if (!hand.present && firstHandLogged && !handLostLogged) {
      handLostLogged = true;
      log("手离开画面", "warn");
    }
    gestureCurl += (hand.curl - gestureCurl) * Math.min(1, dt * 8);
    drawPreview();`);

// 状态行 + 变量声明
s = s.replace("let lastT = performance.now();",
`let lastT = performance.now();
let firstHandLogged = false;
let handLostLogged = false;
let statusTimer = 0;`);

s = s.replace(`  renderer.render(scene, camera);
});`,
`  statusTimer += dt;
  if (statusTimer > 0.5) {
    statusTimer = 0;
    const handTxt = useCamera ? (hand.present ? "手 ✓" : "手 ✗") : "未开摄像头";
    logPanel.setStatus(\`\${Math.round(fps)}fps · \${handTxt}\`);
  }

  renderer.render(scene, camera);
});`);

fs.writeFileSync(p, s, "utf8");
console.log("env:", s.includes("logEnv"), "| status:", s.includes("logPanel.setStatus"), "| firstHand:", s.includes("firstHandLogged"));
