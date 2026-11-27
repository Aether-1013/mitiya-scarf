import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("  (window as unknown as { __scarf: unknown }).__scarf = {",
`  (window as unknown as { __scarf: unknown }).__scarf = {
    hand: () => ({ g: hand.gesture, curls: hand.fingerCurl.map((v) => +v.toFixed(2)), present: hand.present }),`);
fs.writeFileSync(p, s, "utf8");
console.log("hand hook:", s.includes("hand: () =>"));
