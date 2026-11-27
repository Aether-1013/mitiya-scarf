import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  maxJoint: 0.85, // 单个关节最大弯曲（弧度，≈49°）",
  "  maxJoint: Number(params.get(\"maxJoint\") ?? 0.85), // 单个关节最大弯曲（弧度）");
fs.writeFileSync(p, s, "utf8");
console.log("ok", s.includes('params.get("maxJoint")'));
