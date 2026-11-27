import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

s = s.replace(`  // ---------- 须子形态：猜拳模式下完全由游戏驱动，只保留位置跟随 ----------
  const targetShape = scarfCurls ?? idleCurls();
  const shapeK = 1 - Math.exp(-dt * tune.shapeLag);
  for (let i = 0; i < dispCurls.length; i++) {
    dispCurls[i] += (targetShape[i] - dispCurls[i]) * shapeK;
  }
  if (!mirrorMode) fingerTargets = dispCurls;`,
`  // ---------- 须子形态 ----------
  // 猜拳模式：出拳姿态直接回放照片里的动捕（POSES），不再由我们编动作
  const poseDirs =
    !mirrorMode && game.phase === "reveal" && game.scarfPick ? POSES[game.scarfPick] : null;
  // 待机时用一个很轻的放松姿态，避免完全僵硬
  const targetShape = idleCurls();
  const shapeK = 1 - Math.exp(-dt * tune.shapeLag);
  for (let i = 0; i < dispCurls.length; i++) dispCurls[i] += (targetShape[i] - dispCurls[i]) * shapeK;
  if (!mirrorMode) fingerTargets = dispCurls;`);

s = s.replace(`    const fDirs =
      mirrorMode && hand.present && hand.fingerDirs.length >= 5 ? hand.fingerDirs : null;
    drive(smoothTarget, clock.getElapsedTime(), gestureCurl, fingerTargets, dt, fDirs);`,
`    const fDirs = mirrorMode
      ? hand.present && hand.fingerDirs.length >= 5
        ? hand.fingerDirs
        : null
      : (poseDirs as { x: number; y: number; z: number }[][] | null);
    drive(
      smoothTarget,
      clock.getElapsedTime(),
      gestureCurl,
      fingerTargets,
      dt,
      fDirs,
      mirrorMode ? tune.fingerLag : tune.poseLag,
    );`);

fs.writeFileSync(p, s, "utf8");
console.log("poseDirs:", s.includes("const poseDirs ="), "| drive lag:", s.includes("tune.poseLag,"));
