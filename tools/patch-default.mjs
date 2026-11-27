import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace('maxJoint: Number(params.get("maxJoint") ?? 0.85)', 'maxJoint: Number(params.get("maxJoint") ?? 1.9)');
fs.writeFileSync(p, s, "utf8");
console.log("default maxJoint 1.9:", s.includes("?? 1.9"));
