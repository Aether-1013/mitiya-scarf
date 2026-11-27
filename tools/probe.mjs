import fs from "node:fs";
const buf = fs.readFileSync(process.argv[2]);
let o = 4;
const version = buf.readFloatLE(o); o += 4;
const gcount = buf.readUInt8(o); o += 1;
const g = [...buf.subarray(o, o + gcount)]; o += gcount;
const enc = g[0] === 0 ? "utf16le" : "utf8";
const len = buf.readInt32LE(o); o += 4;
const name = buf.toString(enc, o, o + len); o += len;
const len2 = buf.readInt32LE(o); o += 4;
const nameEn = buf.toString(enc, o, o + len2); o += len2;
console.log({ version, gcount, g, enc, name, nameEn, offsetAfterNames: o });
// 跳过两条注释
for (let k = 0; k < 2; k++) { const l = buf.readInt32LE(o); o += 4 + l; }
console.log("vertexCount offset", o, "value", buf.readInt32LE(o));
const vc = buf.readInt32LE(o); o += 4;
console.log("first vertex bytes:", [...buf.subarray(o, o + 60)].map(b=>b.toString(16).padStart(2,"0")).join(" "));
