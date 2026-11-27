import fs from "node:fs";
let r = fs.readFileSync("README.md", "utf8");
r = r.replace(`- 围巾"想一下"（0.24 s）后用自己的 4 根须子摆出手型：全蜷 = 石头，中间两根伸直 = 剪刀，全伸 = 布`,
`- 围巾"想一下"（0.24 s）后出自己的手型。**这三种姿态不是手写参数，而是回放用户提供的三张照片里的手部动捕**：
  石头 ← 握拳照片、剪刀 ← 剪刀照片、布 ← 张开照片。录制脚本 \`tools/dump-poses.mjs\` 把 MediaPipe worldLandmarks
  算出的"5 指 × 3 段方向"写进 \`src/game/poses.ts\`，运行时再重定向到须子骨骼上。
- 猜拳时围巾**只跟随手的位置**，手型完全由回放姿态决定；姿态之间用 slerp 平滑过渡（时间常数约 0.45 s）`);
r = r.replace(`| \`/scarf.html?maxJoint=1.2\` | 覆盖单关节弯曲上限（弧度） |`,
`| \`/scarf.html?maxJoint=1.2\` | 覆盖单关节弯曲上限（弧度） |
| \`/scarf.html?mirror=1\` | 回到"须子跟手"的镜像模式（默认关闭，猜拳用回放姿态） |`);
fs.writeFileSync("README.md", r, "utf8");
console.log("readme:", r.includes("回放用户提供的三张照片"), r.includes("mirror=1"));
