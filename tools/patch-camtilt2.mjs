import fs from "node:fs";
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace("view.tx = -3.4;", "view.tx = -7.2;");
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("tx -7.2");
