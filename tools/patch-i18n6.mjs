import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("onLangChange(() => refreshLang());\nrefreshLang();", "onLangChange(() => refreshLang());");
s = s.replace('let gameMode = params.has("game"); // 默认 = 普通动捕模式（须子跟手）；?game=1 = 猜拳模式',
  'let gameMode = params.has("game"); // 默认 = 普通动捕模式（须子跟手）；?game=1 = 猜拳模式\nrefreshLang(); // gameMode 已初始化，安全地按当前语言刷新一遍 UI');
fs.writeFileSync(p, s, "utf8");
console.log("moved refreshLang after gameMode:", s.includes("安全地按当前语言刷新一遍 UI"));
