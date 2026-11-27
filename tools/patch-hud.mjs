import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  const scarfCurls = game.curls();\n  updateRpsHud(scarfCurls !== null);", "  const scarfCurls = game.curls();\n  updateRpsHud();");
fs.writeFileSync(p, s, "utf8");
console.log("hud call:", s.includes("updateRpsHud();"));
