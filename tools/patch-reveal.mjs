import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace(`if (params.has("rpsFast")) {
  game.thinkTime = 0.05;
  game.revealTime = 60; // 测试时把揭晓画面挂住，方便截图
}`,
`if (params.has("rpsFast")) {
  game.thinkTime = 0.05;
  game.revealTime = 60; // 测试时把揭晓画面挂住，方便截图
}
if (params.has("reveal")) game.revealTime = Number(params.get("reveal"));`);
fs.writeFileSync(p, s, "utf8");
console.log("reveal param:", s.includes('params.get("reveal")'));
