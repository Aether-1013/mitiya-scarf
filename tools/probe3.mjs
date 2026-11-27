import fs from "node:fs";
const buf = fs.readFileSync(process.argv[2]);
let o = 0;
const u8 = () => buf.readUInt8(o++);
const i32 = () => { const v = buf.readInt32LE(o); o += 4; return v; };
const f32 = () => { const v = buf.readFloatLE(o); o += 4; return v; };
const skip = (n) => { if (o + n > buf.length) throw new Error(`overflow skip ${n} at ${o} len ${buf.length}`); o += n; };
const t = () => { const l = i32(); const s = buf.toString("utf16le", o, o + l); o += l; return s; };
o = 4; const ver = f32(); const gc = u8(); const g = []; for (let i=0;i<gc;i++) g.push(u8());
console.log("g", g, "ver", ver);
t(); t(); t(); t();
const vc = i32(); console.log("vertices", vc, "at", o);
const V=2,T=1,M=1,B=2;
const wtCount = {};
for (let i=0;i<vc;i++) {
  skip(32);
  const wt = u8();
  wtCount[wt] = (wtCount[wt]||0)+1;
  if (wt===0) skip(V); else if (wt===1) skip(V*2+4); else if (wt===2) skip(V*4+16); else if (wt===3) skip(V*2+4+36); else if (wt===4) skip(V*4+16); else throw new Error(`bad wt ${wt} @v${i} off ${o-1}`);
  skip(4);
}
console.log("wt histogram", wtCount, "after vertices", o);
const fc = i32(); skip(fc*V); console.log("faces", fc/3, "at", o);
const tc = i32(); console.log("textures", tc, "at", o);
for (let i=0;i<tc;i++) t();
console.log("after textures", o);
const mc = i32(); console.log("materials", mc);
for (let i=0;i<mc;i++) { t(); t(); skip(65); skip(T); skip(T); u8(); const tf=u8(); if(tf===0) skip(T); else u8(); t(); i32(); }
console.log("after materials", o, "next int", buf.readInt32LE(o));
const bc = i32(); console.log("bones", bc);
