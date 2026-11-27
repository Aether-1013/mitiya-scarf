import fs from "node:fs";
let t = fs.readFileSync("tools/rps-forms.mjs", "utf8");
t = t.replace("await p.waitForTimeout(1200);", "await p.waitForTimeout(2800);");
fs.writeFileSync("tools/rps-forms.mjs", t, "utf8");
console.log("wait bumped");
