import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  view.ty = 7.2;", "  view.ty = 9.2;");
s = s.replace("targetNdc.set(Math.sin(t * 0.5) * 0.3, 0.34 + Math.sin(t * 0.85) * 0.12);",
  "targetNdc.set(Math.sin(t * 0.5) * 0.26, 0.3 + Math.sin(t * 0.85) * 0.1);");
fs.writeFileSync(p, s, "utf8");
console.log("ok:", s.includes("view.ty = 9.2"));
