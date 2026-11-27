import fs from "node:fs";
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace("position: absolute; top: 112px; left: 18px;", "position: absolute; top: 122px; left: 18px; z-index: 30;");
h = h.replace("position: absolute; top: 150px; left: 18px;", "position: absolute; top: 162px; left: 18px; z-index: 30;");
fs.writeFileSync("scarf.html", h, "utf8");
console.log("hud nudged:", h.includes("top: 122px"), h.includes("top: 162px"));
