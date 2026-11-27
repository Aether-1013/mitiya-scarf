import fs from "node:fs";
const buf = fs.readFileSync(process.argv[2]);
let o = 0;
const u8 = () => buf.readUInt8(o++);
const i32 = () => { const v = buf.readInt32LE(o); o += 4; return v; };
const f32 = () => { const v = buf.readFloatLE(o); o += 4; return v; };
const skip = (n) => { o += n; };
const t = () => { const l = i32(); const s = buf.toString("utf16le", o, o + l); o += l; return s; };
const ridx = (s) => { if (s===1) return u8(); if (s===2) { const v = buf.readUInt16LE(o); o+=2; return v; } return i32(); };
o = 4; f32(); const gc = u8(); for (let i=0;i<gc;i++) u8();
t(); t(); t(); t();
const vc = i32(); const V=2;
for (let i=0;i<vc;i++){ skip(32); const wt=u8(); if(wt===0)skip(V); else if(wt===1)skip(V*2+4); else if(wt===2)skip(V*4+16); else if(wt===3)skip(V*2+40); else skip(V*4+16); skip(4);}
const fc = i32(); skip(fc*V);
const tc = i32(); for (let i=0;i<tc;i++) t();
const mc = i32();
for (let i=0;i<mc;i++){ t(); t(); skip(65); skip(1); skip(1); u8(); const tf=u8(); if(tf===0) skip(1); else u8(); t(); i32(); }
const T=1;
const bc = i32();
console.log("bones", bc, "at", o);
const kw = /(スカーフ|マフラー|scarf|muffler|cloth|布|围巾|ribbon|リボン|cape|マント)/i;
const names = [];
for (let i=0;i<bc;i++){
  const n = t(); const en = t();
  const px=f32(), py=f32(), pz=f32();
  const parent = ridx(2); skip(4);
  const flags = buf.readUInt16LE(o); o+=2;
  if (flags & 0x0001) skip(12);
  if ((flags & 0x0100)||(flags & 0x0200)) skip(2+4);
  if (flags & 0x0400) skip(12);
  if (flags & 0x0800) skip(24);
  if (flags & 0x2000) skip(4);
  if (flags & 0x0020) { skip(2+4+4); const n2 = i32(); for (let k=0;k<n2;k++){ skip(2); if (u8()) skip(24);} }
  names.push({ i, n, en, parent, pos:[px,py,pz] });
}
console.log("after bones", o, "morphs", buf.readInt32LE(o));
const hit = names.filter(b => kw.test(b.n) || kw.test(b.en));
console.log("scarf-ish bones:", hit.length);
for (const b of hit) console.log(`  #${b.i} ${b.n} | ${b.en} | parent=${b.parent} pos=[${b.pos.map(v=>v.toFixed(2)).join(",")}]`);
fs.writeFileSync("assets_raw/bones.json", JSON.stringify(names, null, 1), "utf8");
console.log("\n--- first 30 bones ---");
for (const b of names.slice(0,30)) console.log(`  #${b.i} ${b.n} | ${b.en}`);
