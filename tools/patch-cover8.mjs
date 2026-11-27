import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");
s = s.replace("top: 28px;", "top: 104px;");
s = s.replace("height: 113%;", "height: 110%;");
fs.writeFileSync(p, s, "utf8");
console.log("top 104px, height 110%");
