import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("let phase: any;", ""); // no-op guard
s = s.replace(`  // ---------- 猜拳流程 ----------
  game.update(dt, () => {`,
`  // ---------- 猜拳流程 ----------
  if (!autoStarted && params.has("autostart") && (useCamera || hpDemo)) {
    autoStarted = true;
    game.start();
  }
  game.update(dt, () => {`);
s = s.replace("const game = new RpsGame((params.get(\"scarf\") as RPS | null) ?? null);",
  "const game = new RpsGame((params.get(\"scarf\") as RPS | null) ?? null);\nlet autoStarted = false;");
fs.writeFileSync(p, s, "utf8");
console.log("autostart:", s.includes("autoStarted"));
