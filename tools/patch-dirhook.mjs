import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("    hand: () => ({ g: hand.gesture, curls: hand.fingerCurl.map((v) => +v.toFixed(2)), ext: hand.ext, present: hand.present }),",
  "    hand: () => ({ g: hand.gesture, curls: hand.fingerCurl.map((v) => +v.toFixed(2)), ext: hand.ext, present: hand.present }),\n    fingerDirs: () => hand.fingerDirs.map((segs) => segs.map((v) => [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)])),");
fs.writeFileSync(p, s, "utf8");
console.log("dirs hook:", s.includes("fingerDirs: () =>"));
