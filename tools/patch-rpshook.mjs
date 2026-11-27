import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  updateRpsHud();", "  updateRpsHud();");
s = s.replace("const RESULT_CN = { win: \"你赢了\", lose: \"围巾赢了\", draw: \"平手\" } as const;",
  "const RESULT_CN = { win: \"你赢了\", lose: \"围巾赢了\", draw: \"平手\" } as const;\n(window as unknown as { __rps: unknown }).__rps = () => ({ phase: game.phase, hold: +game.hold.toFixed(2), seen: game.lastSeen, player: game.playerPick, scarf: game.scarfPick, result: game.result, gesture: hand.gesture, present: hand.present });");
fs.writeFileSync(p, s, "utf8");
console.log("rps hook:", s.includes("__rps"));
