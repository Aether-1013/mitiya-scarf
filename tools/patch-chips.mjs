import fs from "node:fs";
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace('<span class="chip">做手势 → 围巾回应（石头 / 剪刀 / 布）</span>', '<span class="chip" id="chipHint">做手势 → 围巾跟着你动</span>');
h = h.replace('<span class="chip">围巾只跟随位置，手型由它自己决定</span>', '<span class="chip" id="chipMode">须子会跟随你的手指方向</span>');
fs.writeFileSync("scarf.html", h, "utf8");

let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace(`function applyMode() {`,
`const chipHintEl = document.getElementById("chipHint");
const chipModeEl = document.getElementById("chipMode");

function applyMode() {
  if (chipHintEl) chipHintEl.textContent = gameMode ? "做手势 → 围巾回应（石头 / 剪刀 / 布）" : "做手势 → 围巾跟着你动";
  if (chipModeEl) chipModeEl.textContent = gameMode ? "围巾只跟随位置，手型由它自己决定" : "须子会跟随你的手指方向";`);
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("chips:", h.includes("chipHint"), "| applyMode:", s.includes("chipHintEl"));
