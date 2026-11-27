import fs from "node:fs";

// chips 文案
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace('<span class="chip">移动鼠标 → 围巾追着走</span>', '<span class="chip">做手势 → 围巾回应（石头 / 剪刀 / 布）</span>');
h = h.replace('<span class="chip">✊ 握拳 → 卷起来</span>', '<span class="chip">围巾只跟随位置，手型由它自己决定</span>');
fs.writeFileSync("scarf.html", h, "utf8");

// 暴露形态进度，方便测平滑度
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace("__rps = () => ({ phase: game.phase,",
  "__rps = () => ({ shape: dispCurls.map((v) => +v.toFixed(2)), phase: game.phase,");
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("chips:", h.includes("围巾回应"), "| shape hook:", s.includes("shape: dispCurls"));
