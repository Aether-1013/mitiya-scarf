import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace("    hand: () => ({ g: hand.gesture, curls: hand.fingerCurl.map((v) => +v.toFixed(2)), present: hand.present }),",
  "    hand: () => ({ g: hand.gesture, curls: hand.fingerCurl.map((v) => +v.toFixed(2)), ext: hand.ext, present: hand.present }),");
s = s.replace("    basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },\n  };",
  "    ext: [bend < 0.5, bend < 0.5, bend < 0.5, bend < 0.5, bend < 0.5],\n    basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },\n  };");
fs.writeFileSync(p, s, "utf8");
console.log("demo ext:", s.includes("ext: [bend"));
