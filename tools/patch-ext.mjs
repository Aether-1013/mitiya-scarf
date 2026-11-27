import fs from "node:fs";
const p = "src/vision/gesture.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  /** 手掌坐标系三轴（世界坐标）：S 指向食指侧，U 指向上，N 为掌面法线 */",
  "  /** 每根手指是否伸直（调试用） */\n  ext: boolean[];\n  /** 手掌坐标系三轴（世界坐标）：S 指向食指侧，U 指向上，N 为掌面法线 */");
s = s.replace("  basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },\n};",
  "  ext: [false, false, false, false, false],\n  basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },\n};");
s = s.replace("    fingerDirs: smoothedDirs,\n    fingerCurl,\n    basis:",
  "    fingerDirs: smoothedDirs,\n    fingerCurl,\n    ext: extended,\n    basis:");
fs.writeFileSync(p, s, "utf8");
console.log("ext added:", s.includes("ext: extended"));
