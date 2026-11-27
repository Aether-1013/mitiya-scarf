import fs from "node:fs";

// --- scarfview: 加 side / splay ---
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace("  /** 父骨在 backbone 里的下标（A 挂 SplineIK06，B/C/D 挂 HandA01） */\n  parentIdx: number;\n};",
  "  /** 父骨在 backbone 里的下标（A 挂 SplineIK06，B/C/D 挂 HandA01） */\n  parentIdx: number;\n  /** 相对手掌中心在左(-1)还是右(+1)，用于张开时向外扇 */\n  side: number;\n};");
s = s.replace("      parentIdx: backbone.indexOf(arr[0].parent as THREE.Bone),",
  "      parentIdx: backbone.indexOf(arr[0].parent as THREE.Bone),\n      side: Math.sign(arr[0].position.x) || 1,");
s = s.replace("  palmAmt: 0.3, // 手指弯曲时，手掌跟着弯多少",
  "  palmAmt: 0.3, // 手指弯曲时，手掌跟着弯多少\n  splay: 0.55, // 伸直时向外扇开的角度（弧度/根）");
s = s.replace(`        const qWorld = new THREE.Quaternion().setFromAxisAngle(fc.axis, fc.ang[j]);
        const delta = fc.parentQ[j].clone().invert().multiply(qWorld).multiply(fc.parentQ[j]);`,
`        const qWorld = new THREE.Quaternion().setFromAxisAngle(fc.axis, fc.ang[j]);
        if (j === 0 && tune.splay > 0) {
          // 伸直时向外扇开，让"布"的四根须子拉开
          const palmNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(handWQ).normalize();
          qWorld.premultiply(
            new THREE.Quaternion().setFromAxisAngle(palmNormal, (1 - c) * tune.splay * fc.side),
          );
        }
        const delta = fc.parentQ[j].clone().invert().multiply(qWorld).multiply(fc.parentQ[j]);`);
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("splay wired:", s.includes("tune.splay"), "| side:", s.includes("side: Math.sign(arr[0].position.x)"));

// --- 布局：比分行/结果横幅挪到左侧，避开右上动捕窗 ---
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace(`      #rpsScore {
        position: absolute; top: 22px; left: 50%; transform: translateX(-50%);`,
`      #rpsScore {
        position: absolute; top: 112px; left: 18px;`);
h = h.replace(`      #rpsLine {
        position: absolute; top: 72px; left: 50%; transform: translateX(-50%);`,
`      #rpsLine {
        position: absolute; top: 150px; left: 18px;`);
fs.writeFileSync("scarf.html", h, "utf8");
console.log("layout:", h.includes("top: 112px"), h.includes("top: 150px"));
