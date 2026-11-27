import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 1) 替换旧的 HUD/按钮逻辑
const oldBlock = s.slice(s.indexOf("// ---------- 猜拳 ----------"), s.indexOf("renderer.setAnimationLoop(() => {"));
const newBlock = `// ---------- 猜拳（反应式） ----------
const game = new RpsGame((params.get("scarf") as RPS | null) ?? null);
game.counter = params.has("counter");
if (params.has("rpsFast")) {
  game.thinkTime = 0.05;
  game.revealTime = 60; // 测试时把揭晓画面挂住，方便截图
}
const rpsCountEl = document.getElementById("rpsCount") as HTMLDivElement;
const rpsLineEl = document.getElementById("rpsLine") as HTMLDivElement;
const rpsScoreEl = document.getElementById("rpsScore") as HTMLDivElement;
const rpsStartEl = document.getElementById("rpsStart") as HTMLButtonElement | null;
if (rpsStartEl) rpsStartEl.textContent = "重置比分";
rpsStartEl?.addEventListener("click", () => game.resetScore());

const RESULT_CN = { win: "你赢了", lose: "围巾赢了", draw: "平手" } as const;

function updateRpsHud() {
  const thinking = game.phase === "think";
  const showing = game.phase === "reveal";

  const count = thinking ? "…" : "";
  if (rpsCountEl.textContent !== count) rpsCountEl.textContent = count;
  rpsCountEl.classList.toggle("show", thinking);

  if (showing && game.playerPick && game.scarfPick && game.result) {
    const html =
      \`你 \${RPS_CN[game.playerPick]} · 围巾 \${RPS_CN[game.scarfPick]}<br>\` +
      \`<span class="\${game.result}">\${RESULT_CN[game.result]}</span>\`;
    if (rpsLineEl.innerHTML !== html) rpsLineEl.innerHTML = html;
    rpsLineEl.classList.add("show");
  } else if (game.phase === "wait") {
    const want = game.rounds === 0 ? "做个手势（石头 / 剪刀 / 布）" : "";
    if (rpsLineEl.textContent !== want) rpsLineEl.textContent = want;
    rpsLineEl.classList.toggle("show", want !== "");
  } else {
    rpsLineEl.classList.remove("show");
  }

  const sc = \`你 \${game.score.win} : \${game.score.lose} 围巾\`;
  if (rpsScoreEl.textContent !== sc) rpsScoreEl.textContent = sc;
}

`;
s = s.replace(oldBlock, newBlock);

// 2) 循环里去掉 autoStarted / updateRpsHud 旧调用
s = s.replace(`  if (!autoStarted && params.has("autostart") && (useCamera || hpDemo)) {
    autoStarted = true;
    game.start();
  }
`, "");
s = s.replace("  const scarfCurls = game.curls();\n  updateRpsHud();", "  const scarfCurls = game.curls();\n  updateRpsHud();");

fs.writeFileSync(p, s, "utf8");
console.log("block replaced:", s.includes("反应式"), "| autoStarted gone:", !s.includes("autoStarted"));
