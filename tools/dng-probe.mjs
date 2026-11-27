import fs from "node:fs";
const f = process.argv[2];
const b = fs.readFileSync(f);
console.log("size", b.length, "head", [...b.subarray(0,16)].map(x=>x.toString(16).padStart(2,"0")).join(" "));
const ascii = b.toString("latin1");
for (const k of ["DNG","Adobe","JFIF","Exif","TIFF","RAW"]) {
  const i = ascii.indexOf(k);
  console.log(k, i >= 0 ? i : "none");
}
// 找所有 JPEG SOI
const soi = [];
for (let i = 0; i + 1 < b.length; i++) if (b[i] === 0xff && b[i+1] === 0xd8) soi.push(i);
console.log("SOI count", soi.length, soi.slice(0, 8));
// 找 SOF 标记
const sof = [];
for (let i = 0; i + 1 < b.length; i++) if (b[i] === 0xff && (b[i+1] === 0xc0 || b[i+1] === 0xc2)) sof.push(i);
console.log("SOF count", sof.length, sof.slice(0, 5));
if (sof.length) {
  const o = sof[0];
  console.log("SOF bytes", [...b.subarray(o, o + 24)].map(x=>x.toString(16).padStart(2,"0")).join(" "));
}
