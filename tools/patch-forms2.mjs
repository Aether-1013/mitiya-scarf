import fs from "node:fs";
let t = fs.readFileSync("tools/rps-forms.mjs", "utf8");
if (!t.includes("game=1")) t = t.replace("&rpsFast=1", "&rpsFast=1&game=1");
fs.writeFileSync("tools/rps-forms.mjs", t, "utf8");
console.log("game=1 added:", t.includes("game=1"));
