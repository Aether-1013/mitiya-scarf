import fs from "node:fs";

// 1) 时间常数与说明对齐（τ≈0.45s）
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace("  poseLag: 3.6,", "  poseLag: 2.2,");
s = s.replace("  shapeLag: 3.2,", "  shapeLag: 2.2,");
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("lag:", s.includes("poseLag: 2.2"));

// 2) 底部胶囊缩小下移，避免压住本体
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace(`      .chips {
        position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%);
        display: flex; gap: 8px; align-items: center;
        pointer-events: auto;
      }`,
`      .chips {
        position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%);
        display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center;
        max-width: 96vw; pointer-events: auto;
      }`);
h = h.replace(`      .chip {
        font-size: 12px; padding: 7px 12px; border-radius: 999px;`,
`      .chip {
        font-size: 11px; padding: 4px 9px; border-radius: 999px; opacity: 0.85;`);
h = h.replace("      .chipBtn {\n        width: auto; margin: 0; padding: 8px 14px; font-size: 12px;",
  "      .chipBtn {\n        width: auto; margin: 0; padding: 6px 11px; font-size: 11px;");
fs.writeFileSync("scarf.html", h, "utf8");
console.log("chips compacted:", h.includes("bottom: 6px"));
