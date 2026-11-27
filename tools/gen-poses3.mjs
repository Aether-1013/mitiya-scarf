import fs from "node:fs";

const p = JSON.parse(fs.readFileSync("poses.json", "utf8"));

/** 手掌坐标系里 y 分量 = 手指相对掌心的"伸展度" */
const ext = (dirs, f) => dirs[f][0][1];

/**
 * 拇指修补：
 * MediaPipe 对拇指的姿态估计在握拳/剪刀时会失真（拇指朝上），
 * 而真实手型里拇指应压在掌内。规则：若拇指明显伸直、而其余手指里有明显蜷曲的，
 * 就用蜷得最厉害那根手指的方向兜底。
 */
function repairThumb(dirs) {
  const others = [1, 2, 3, 4];
  const e0 = ext(dirs, 0);
  const minOther = Math.min(...others.map((f) => ext(dirs, f)));
  if (e0 > 0.8 && minOther < 0.75) {
    const mostCurled = others.reduce((a, f) => (ext(dirs, f) < ext(dirs, a) ? f : a), others[0]);
    const copy = dirs[mostCurled].map((v) => [...v]);
    return { dirs: [copy, ...dirs.slice(1)], repaired: true, from: mostCurled };
  }
  return { dirs, repaired: false, from: -1 };
}

const out = {};
const log = [];
for (const k of ["rock", "scissors", "paper"]) {
  const r = repairThumb(p[k].dirs);
  out[k] = r.dirs;
  log.push(`${k}: thumb ${r.repaired ? "已修补 ← 第" + r.from + "根" : "保持原样"}`);
}

const toObj = (dirs) =>
  dirs.map((segs) => segs.map(([x, y, z]) => ({ x: +x.toFixed(4), y: +y.toFixed(4), z: +z.toFixed(4) })));

const header = `/**
 * 围巾的三种出手姿态，全部来自用户提供的照片（MediaPipe worldLandmarks 回放），不是手写动作：
 *   rock     ← IMG_20261111_005655415（握拳）
 *   scissors ← IMG_20261111_005704566（剪刀）
 *   paper    ← IMG_20261111_005646414（张开）
 * 每项是 5 根手指 × 3 段的方向（手掌坐标系：x=食指侧行, y=掌心朝指尖, z=掌面法线）。
 *
 * 唯一的人工规则：${log.join("；")}。
 * 原因：MediaPipe 对拇指在握拳/剪刀时的朝向常有偏差（拇指朝上），真实手型里应压在掌内，
 * 所以当"拇指明显伸直 + 其余手指有蜷曲"时，用蜷得最厉害那根手指的方向兜底。
 */
export type PoseDirs = { x: number; y: number; z: number }[][];

export const POSES: Record<"rock" | "scissors" | "paper", PoseDirs> = {
`;

const body = ["rock", "scissors", "paper"]
  .map((k) => `  ${k}: ${JSON.stringify(toObj(out[k]))},`)
  .join("\n");

const footer = `
};

export const POSE_SOURCE: Record<"rock" | "scissors" | "paper", string> = {
  rock: "IMG_20261111_005655415（握拳）",
  scissors: "IMG_20261111_005704566（剪刀）",
  paper: "IMG_20261111_005646414（张开）",
};
`;

fs.writeFileSync("src/game/poses.ts", header + body + footer, "utf8");
console.log(log.join("\n"));
console.log("poses.ts regenerated");
