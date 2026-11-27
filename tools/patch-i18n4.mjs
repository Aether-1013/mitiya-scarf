import fs from "node:fs";
let s = fs.readFileSync("src/scarfview.ts", "utf8");

// 状态行本地化
s = s.replace("statusEl.textContent = `${(tris.length || indices.length) / 3} 面 · ${backbone.length} 骨`;",
  'statusEl.textContent =\n    lang() === "zh"\n      ? `${(tris.length || indices.length) / 3} 面 · ${backbone.length} 骨`\n      : `${(tris.length || indices.length) / 3} tris · ${backbone.length} bones`;');

// 初始化时刷新一次语言相关按钮
s = s.replace("if (langBtnEl) langBtnEl.textContent = t(\"btnLang\");",
  "if (langBtnEl) langBtnEl.textContent = t(\"btnLang\");\nif (camBtn) camBtn.textContent = t(\"btnCamOn\");");

fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("stats:", s.includes("tris ·"), "| camBtn init:", s.includes('camBtn.textContent = t("btnCamOn")'));
