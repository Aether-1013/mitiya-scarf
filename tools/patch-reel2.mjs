import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

s = s.replace(`  for (const sel of [".chips", "#rpsScore", "#rpsStart", ".credit", "#gate"]) {`,
`  for (const sel of [".chips", ".panel", "#rpsScore", "#rpsStart", ".credit", "#gate"]) {`);

// 录屏模式收紧构图
s = s.replace(`if (reel) {
  document.getElementById("logPanel")?.remove();`,
`if (reel) {
  document.getElementById("logPanel")?.remove();
  view.r = 13;
  view.ty = 6.6;
  updateCamera();`);

fs.writeFileSync(p, s, "utf8");
console.log("reel framing:", s.includes("view.r = 13"));
