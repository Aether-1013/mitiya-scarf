import fs from "node:fs";
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace("  view.ty = 9.2;\n  view.tx = -7.2;", "  view.ty = 9.2;");
fs.writeFileSync("src/scarfview.ts", s, "utf8");

let h = fs.readFileSync("shots/cover.html", "utf8");
h = h.replace("object-position: 88% 4%;", "object-position: 50% 6%;");
h = h.replace("#bg {\n        position: absolute;\n        inset: 0;\n        width: 100%;\n        height: 100%;",
  "#bg {\n        position: absolute;\n        inset: 0;\n        width: 100%;\n        height: 100%;\n        transform: translateX(320px) scale(1.1);\n        transform-origin: 50% 50%;");
h = h.replace('<div class="credit">model: HoYoverse / 樱MMD / _qiuu秋</div>', '<div class="credit">model: HoYoverse</div>');
// 左侧渐变对应调整，保证标题区域干净
h = h.replace("rgba(5,3,12,0.98) 0%", "rgba(5,3,12,0.99) 0%");
fs.writeFileSync("shots/cover.html", h, "utf8");
console.log("tx reset:", !s.includes("view.tx = -7.2"), "| translate:", h.includes("translateX(320px)"), "| credit:", h.includes("model: HoYoverse</div>"));
