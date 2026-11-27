import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  fingerAmt: 0.9, // 须子最大弯曲角（弧度）—— 不完全握死",
  "  fingerAmt: 1.9, // 须子最大弯曲角（弧度）：猜拳要能真的握成拳");
s = s.replace("        const g = Math.min(c * tune.fingerAmt, tune.fingerAmt) * RATIO[j] + wobble * (j + 1) * 0.3;",
  "        const g = Math.min(c, 1) * tune.fingerAmt * RATIO[j] + wobble * (j + 1) * 0.2;");
fs.writeFileSync(p, s, "utf8");
console.log("fingerAmt:", s.includes("fingerAmt: 1.9"), "| clamp removed:", s.includes("Math.min(c, 1) * tune.fingerAmt"));
