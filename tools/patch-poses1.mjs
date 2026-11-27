import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 1) 引入录制的姿态
s = s.replace('import { RpsGame, RPS_CN, type RPS } from "./game/rps";',
  'import { RpsGame, RPS_CN, type RPS } from "./game/rps";\nimport { POSES } from "./game/poses";');

// 2) drive 增加 lag 参数
s = s.replace(`  dt: number,
  fDirs: { x: number; y: number; z: number }[][] | null,
) {`,
`  dt: number,
  fDirs: { x: number; y: number; z: number }[][] | null,
  lag: number = tune.fingerLag,
) {`);
s = s.replace("      const blend = 1 - Math.exp(-dt * tune.fingerLag);",
  "      const blend = 1 - Math.exp(-dt * lag);");

// 3) 弹簧路径也改成 slerp，避免从"回放姿态"切回待机时跳变
s = s.replace(`        const delta = fc.parentQ[j].clone().invert().multiply(qWorld).multiply(fc.parentQ[j]);
        fc.bones[j].quaternion.copy(fc.restQ[j]).premultiply(delta);`,
`        const delta = fc.parentQ[j].clone().invert().multiply(qWorld).multiply(fc.parentQ[j]);
        const targetQ = fc.restQ[j].clone().premultiply(delta);
        fc.bones[j].quaternion.slerp(targetQ, 1 - Math.exp(-dt * lag));`);

// 4) 新增 poseLag 参数
s = s.replace("  shapeLag: 3.2, // 猜拳形态之间过渡的平滑速度（越小越慢）",
  "  shapeLag: 3.2, // 猜拳形态之间过渡的平滑速度（越小越慢）\n  poseLag: 3.6, // 回放姿态之间的过渡速度（越小越慢、越丝滑）");

fs.writeFileSync(p, s, "utf8");
console.log("pose import:", s.includes("from \"./game/poses\""), "| lag param:", s.includes("lag: number = tune.fingerLag"), "| slerp spring:", s.includes("const targetQ = fc.restQ[j]"));
