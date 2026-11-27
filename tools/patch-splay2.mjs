import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  splay: 0.55,", "  splay: 0.32,");
fs.writeFileSync(p, s, "utf8");
console.log("splay 0.32:", s.includes("splay: 0.32"));
