import fs from "node:fs";

const p = JSON.parse(fs.readFileSync("poses.json", "utf8"));

const header = `/**
 * 围巾的三种出手姿态，全部来自用户提供的照片（MediaPipe worldLandmarks 回放），
 * 不是手写动作：
 *   rock     ← IMG_20261111_005655415（握拳）
 *   scissors ← IMG_20261111_005704566（剪刀）
 *   paper    ← IMG_20261111_005646414（张开）
 * 每项是 5 根手指 × 3 段的方向（手掌坐标系）。
 */
export type PoseDirs = number[][][];

export const POSES: Record<"rock" | "scissors" | "paper", PoseDirs> = {
`;

const body = ["rock", "scissors", "paper"]
  .map((k) => `  ${k}: ${JSON.stringify(p[k].dirs)},`)
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
console.log("poses.ts written:", (header + body + footer).length, "bytes");
