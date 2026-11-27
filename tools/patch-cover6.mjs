import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");
s = s.replace("top: -56px;", "top: 28px;");
s = s.replace("height: 116%;", "height: 113%;");
fs.writeFileSync(p, s, "utf8");
console.log("hero top -> 28px");
