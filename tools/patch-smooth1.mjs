import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 1) 新增参数：形态切换的平滑速度 + 静止姿态
s = s.replace("  splay: 0.55, // 伸直时向外扇开的角度（弧度/根）",
`  splay: 0.55, // 伸直时向外扇开的角度（弧度/根）
  shapeLag: 3.2, // 猜拳形态之间过渡的平滑速度（越小越慢）
  idleCurl: 0.3, // 待机时须子的放松蜷曲度`);

// 2) 形态显示用的平滑状态
s = s.replace("const RESULT_CN = { win: \"你赢了\", lose: \"围巾赢了\", draw: \"平手\" } as const;",
`const RESULT_CN = { win: "你赢了", lose: "围巾赢了", draw: "平手" } as const;

/** 猜拳模式下须子的"显示形态"：在目标形态之间做慢速插值，避免瞬切 */
const dispCurls = [0.3, 0.3, 0.3, 0.3, 0.3];
const idleCurls = () => [tune.idleCurl, tune.idleCurl, tune.idleCurl, tune.idleCurl, tune.idleCurl];
const mirrorMode = params.has("mirror"); // ?mirror=1 才保留"须子跟手"的旧行为`);

fs.writeFileSync(p, s, "utf8");
console.log("params:", s.includes("shapeLag"), "| disp:", s.includes("dispCurls"));
