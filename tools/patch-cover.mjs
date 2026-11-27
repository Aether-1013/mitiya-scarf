import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");
s = s.replace("object-position: 62% 45%;", "object-position: 56% 8%;");
s = s.replace("transform: scale(1.06);", "transform: scale(1.0);");
fs.writeFileSync(p, s, "utf8");
console.log("ok");
