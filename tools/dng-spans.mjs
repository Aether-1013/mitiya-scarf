import fs from "node:fs";
const b = fs.readFileSync(process.argv[2]);
const soi = [];
for (let i = 0; i + 1 < b.length; i++) if (b[i] === 0xff && b[i+1] === 0xd8) soi.push(i);
for (const s of soi) {
  let e = -1;
  for (let j = s + 2; j + 1 < b.length; j++) if (b[j] === 0xff && b[j+1] === 0xd9) { e = j + 2; break; }
  console.log(`SOI@${s} -> ${e > 0 ? `EOI@${e} len=${((e-s)/1024).toFixed(0)}KB` : "no EOI"}`);
}
