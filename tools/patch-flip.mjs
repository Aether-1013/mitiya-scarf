import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace(`    const Sw = rootA.clone().sub(rootD).normalize();`,
`    const flipS = params.has("flipS") ? -1 : 1;
    const flipU = params.has("flipU") ? -1 : 1;
    const Sw = rootA.clone().sub(rootD).normalize().multiplyScalar(flipS);`);
s = s.replace(`    if (Uw.lengthSq() < 1e-6) Uw.set(0, 1, 0);
    Uw.normalize();`,
`    if (Uw.lengthSq() < 1e-6) Uw.set(0, 1, 0);
    Uw.normalize().multiplyScalar(flipU);`);
fs.writeFileSync(p, s, "utf8");
console.log("flip params:", s.includes("flipS"), s.includes("flipU"));
