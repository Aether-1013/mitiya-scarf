import fs from "node:fs";

// 1) HTML：加一个模式切换按钮
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace('<button id="startCam" class="chipBtn">开启摄像头</button>',
  '<button id="modeBtn" class="chipBtn">切到猜拳</button>\n          <button id="startCam" class="chipBtn">开启摄像头</button>');
fs.writeFileSync("scarf.html", h, "utf8");
console.log("modeBtn:", h.includes("modeBtn"));

// 2) TS：默认动捕模式，?game=1 才进猜拳
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace('const mirrorMode = params.has("mirror"); // ?mirror=1 才保留"须子跟手"的旧行为',
  'let gameMode = params.has("game"); // 默认 = 普通动捕模式（须子跟手）；?game=1 = 猜拳模式');
s = s.replace(`  const poseDirs =
    !mirrorMode && game.phase === "reveal" && game.scarfPick ? POSES[game.scarfPick] : null;`,
`  const poseDirs =
    gameMode && game.phase === "reveal" && game.scarfPick ? POSES[game.scarfPick] : null;`);
s = s.replace("  if (!mirrorMode) fingerTargets = dispCurls;", "  if (gameMode) fingerTargets = dispCurls;");
s = s.replace(`    const fDirs = mirrorMode
      ? hand.present && hand.fingerDirs.length >= 5
        ? hand.fingerDirs
        : null
      : (poseDirs as { x: number; y: number; z: number }[][] | null);`,
`    const fDirs = gameMode
      ? (poseDirs as { x: number; y: number; z: number }[][] | null)
      : hand.present && hand.fingerDirs.length >= 5
        ? hand.fingerDirs
        : null;`);
s = s.replace("      mirrorMode ? tune.fingerLag : tune.poseLag,", "      gameMode ? tune.poseLag : tune.fingerLag,");
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("gameMode:", s.includes("let gameMode"), "| poseDirs:", s.includes("gameMode && game.phase"), "| fDirs:", s.includes("const fDirs = gameMode"));
