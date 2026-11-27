import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");
// 抠图后不需要羽化遮罩，只留一点边缘柔化
s = s.replace(/        -webkit-mask-image:[\s\S]*?mask-composite: intersect;\n/, `
`);
s = s.replace("filter: drop-shadow(0 0 60px rgba(120,70,220,0.35));",
  "filter: drop-shadow(0 0 70px rgba(120,70,220,0.45));");
fs.writeFileSync(p, s, "utf8");
console.log("mask removed:", !s.includes("mask-image"));
