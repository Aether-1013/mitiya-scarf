import fs from "node:fs";
const buf = fs.readFileSync(process.argv[2]);
const base = 58; // 顶点区块起点（header 之后，见 probe 输出）
const start = 56;
console.log("base bytes:", [...buf.subarray(start, start + 120)].map(b=>b.toString(16).padStart(2,"0")).join(" "));
for (const off of [32, 35, 39, 41, 45, 49]) {
  const v = [];
  for (let k = 0; k < 6; k++) v.push(buf.readFloatLE(start + off + k*4).toFixed(3));
  const n = Math.hypot(+v[3], +v[4], +v[5]);
  console.log(`offset ${off}: ${v.join(" ")}  |n|=${n.toFixed(3)}`);
}
