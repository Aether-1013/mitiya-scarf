import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 模式切换逻辑：按钮 + RPS 面板显隐
s = s.replace(`const rpsStartEl = document.getElementById("rpsStart") as HTMLButtonElement | null;`,
`const rpsStartEl = document.getElementById("rpsStart") as HTMLButtonElement | null;
const rpsRootEl = document.getElementById("rps") as HTMLDivElement | null;
const modeBtnEl = document.getElementById("modeBtn") as HTMLButtonElement | null;

function applyMode() {
  if (rpsRootEl) rpsRootEl.style.display = gameMode ? "flex" : "none";
  if (modeBtnEl) modeBtnEl.textContent = gameMode ? "切到动捕" : "切到猜拳";
  statusEl.textContent = gameMode ? "猜拳模式（只跟位置）" : "动捕模式（须子跟手）";
  game.resetScore();
  game.phase = "wait";
  game.t = 0;
  game.hold = 0;
  game.lastSeen = null;
}
modeBtnEl?.addEventListener("click", () => {
  gameMode = !gameMode;
  applyMode();
});`);

// 初始化时应用一次
s = s.replace("renderer.setAnimationLoop(() => {", "applyMode();\n\nrenderer.setAnimationLoop(() => {");
fs.writeFileSync(p, s, "utf8");
console.log("applyMode:", s.includes("function applyMode"), "| init:", s.includes("applyMode();\n\nrenderer"));
