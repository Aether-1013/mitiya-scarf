import fs from "node:fs";
const p = "src/game/rps.ts";
let s = fs.readFileSync(p, "utf8");
// 4 根须子取 拇指/食指/中指/无名指：剪刀 = 食指中指伸、拇指无名指蜷
s = s.replace("  scissors: [1, 0, 0, 0, 1],", "  scissors: [1, 0, 0, 1, 1],");
// 比分在进入揭晓时就加，避免"你赢了 + 0:0"同帧
s = s.replace(`        this.phase = "think";
        this.t = 0;`,
`        this.phase = "think";
        this.t = 0;`);
s = s.replace(`      if (this.t >= this.thinkTime) {
        this.phase = "reveal";
        this.t = 0;
      }`,
`      if (this.t >= this.thinkTime) {
        this.phase = "reveal";
        this.t = 0;
        if (this.result) this.score[this.result]++;
        this.rounds++;
      }`);
s = s.replace(`    if (this.phase === "reveal" && this.t >= this.revealTime) {
      if (this.result) this.score[this.result]++;
      this.rounds++;
      this.phase = "wait";`,
`    if (this.phase === "reveal" && this.t >= this.revealTime) {
      this.phase = "wait";`);
fs.writeFileSync(p, s, "utf8");
console.log("scissors curls:", s.includes("scissors: [1, 0, 0, 1, 1]"), "| score on reveal:", s.includes("if (this.result) this.score[this.result]++;\n        this.rounds++;"));
