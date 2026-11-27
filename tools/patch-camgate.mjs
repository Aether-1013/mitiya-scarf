import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 首屏加载完成 → 用 hideGate
s = s.replace(`      setProgress(0, "就绪");
      finishBar();
      gate.classList.add("hide");`,
`      setProgress(0, "就绪");
      hideGate(0);`);

// 摄像头初始化：显示遮罩 + 假条
s = s.replace(`  try {
    if (!navigator.mediaDevices?.getUserMedia) {`,
`  showGate(
    "HAND TRACKING",
    "启动手部动捕",
    "下载推理引擎与动捕模型，大约 10–30 秒（视网速）",
    30000,
  );
  try {
    if (!navigator.mediaDevices?.getUserMedia) {`);

// init 的进度文字同步到遮罩
s = s.replace(`    tracker = new HandTracker();
    await tracker.init((m) => {
      statusEl.textContent = m;
      log(m);
    });`,
`    tracker = new HandTracker();
    await tracker.init((m) => {
      statusEl.textContent = m;
      log(m);
      setProgress(0, m);
    });`);

// 成功 / 失败收尾
s = s.replace(`    log(\`推理引擎就绪（\${tracker.delegate}），开始追踪\`, "ok");`,
`    log(\`推理引擎就绪（\${tracker.delegate}），开始追踪\`, "ok");
    setProgress(0, \`就绪（\${tracker.delegate}）\`);
    hideGate(400);`);

s = s.replace(`    log(\`建议：\${hint}\`, "warn");`,
`    log(\`建议：\${hint}\`, "warn");
    if (gateHintEl) gateHintEl.textContent = \`摄像头启动失败：\${hint}\`;
    setProgress(0, err.name ?? "错误");
    window.setTimeout(() => hideGate(0), 4000);`);

fs.writeFileSync(p, s, "utf8");
console.log("gate on camera:", s.includes('"启动手部动捕"'), "| hide ok:", s.includes("hideGate(400)"), "| err:", s.includes("摄像头启动失败"));
