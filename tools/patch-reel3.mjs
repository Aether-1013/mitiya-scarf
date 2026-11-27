import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  view.r = 13;\n  view.ty = 6.6;", "  view.r = 17.5;\n  view.ty = 7.2;");
s = s.replace("targetNdc.set(Math.sin(t * 0.55) * 0.42, 0.36 + Math.sin(t * 0.92) * 0.16);",
  "targetNdc.set(Math.sin(t * 0.5) * 0.3, 0.34 + Math.sin(t * 0.85) * 0.12);");
fs.writeFileSync(p, s, "utf8");
console.log("ok:", s.includes("view.r = 17.5"), s.includes("* 0.3,"));
