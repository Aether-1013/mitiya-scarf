/**
 * 最小 PMX 解析器（带索引宽度自适应）。
 *
 * 有导出器会把 globals 里的索引宽度写成"字节数"而不是规范里的"0/1/2 编码"，
 * 所以这里两种解释都试，用解析是否自洽（形态键数量是否合理）来判定。
 *
 * 用法：node tools/pmx-bones.mjs <file.pmx> [out.json]
 */
import fs from "node:fs";

const file = process.argv[2];
const outPath = process.argv[3] ?? "assets_raw/bones.json";

function parseModel(buf, mode) {
  let o = 0;
  const u8 = () => buf.readUInt8(o++);
  const i32 = () => { const v = buf.readInt32LE(o); o += 4; return v; };
  const f32 = () => { const v = buf.readFloatLE(o); o += 4; return v; };
  const skip = (n) => { o += n; };
  const readIdx = (size) =>
    size === 1 ? u8() : size === 2 ? ((v) => { const x = buf.readUInt16LE(o); o += 2; return x; })() : i32();

  const magic = buf.toString("ascii", 0, 4);
  o = 4;
  const version = f32();
  const gcount = u8();
  const g = [];
  for (let i = 0; i < gcount; i++) g.push(u8());

  const enc = g[0] === 0 ? "utf16le" : "utf8";
  const addUV = g[1];
  const dec = (code) => (mode === "code" ? 1 << code : code);
  const vIdx = dec(g[2]);
  const tIdx = dec(g[3]);
  const mIdx = dec(g[4]);
  const bIdx = dec(g[5]);
  const moIdx = dec(g[6]);
  const rIdx = dec(g[7]);

  const text = () => {
    const len = i32();
    const s = buf.toString(enc, o, o + len);
    o += len;
    return s;
  };

  const name = text();
  const nameEn = text();
  text();
  text();

  const vertexCount = i32();
  for (let i = 0; i < vertexCount; i++) {
    skip(3 * 4 + 3 * 4 + 2 * 4 + addUV * 4 * 4);
    const wt = u8();
    if (wt === 0) skip(vIdx);
    else if (wt === 1) skip(vIdx * 2 + 4);
    else if (wt === 2) skip(vIdx * 4 + 16);
    else if (wt === 3) skip(vIdx * 2 + 4 + 36);
    else if (wt === 4) skip(vIdx * 4 + 16);
    else throw new Error(`bad weight type ${wt} @v${i}`);
    skip(4);
  }

  const faceCount = i32();
  skip(faceCount * vIdx);

  const texCount = i32();
  const textures = [];
  for (let i = 0; i < texCount; i++) textures.push(text());

  const matCount = i32();
  const materials = [];
  for (let i = 0; i < matCount; i++) {
    const mName = text();
    const mEn = text();
    skip(11 * 4 + 1 + 5 * 4);
    const texIdx = readIdx(tIdx);
    const sphereIdx = readIdx(tIdx);
    const sphereMode = u8();
    const toonFlag = u8();
    if (toonFlag === 0) readIdx(tIdx);
    else u8();
    text();
    const surfaceCount = i32();
    materials.push({ name: mName, nameEn: mEn, texIdx, sphereIdx, sphereMode, surfaceCount });
  }

  const boneCount = i32();
  const bones = [];
  for (let i = 0; i < boneCount; i++) {
    const bName = text();
    const bEn = text();
    const px = f32();
    const py = f32();
    const pz = f32();
    const parent = readIdx(bIdx);
    skip(4);
    const flags = buf.readUInt16LE(o);
    o += 2;
    if (flags & 0x0001) skip(12);
    if (flags & 0x0100 || flags & 0x0200) skip(bIdx + 4);
    if (flags & 0x0400) skip(12);
    if (flags & 0x0800) skip(24);
    if (flags & 0x2000) skip(4);
    if (flags & 0x0020) {
      skip(bIdx + 4 + 4);
      const links = i32();
      for (let k = 0; k < links; k++) {
        skip(bIdx);
        if (u8()) skip(24);
      }
    }
    bones.push({ i, name: bName, en: bEn, parent, pos: [px, py, pz], flags });
  }

  const morphCount = i32();
  return {
    magic, version, name, nameEn, g, enc, addUV,
    sizes: { vIdx, tIdx, mIdx, bIdx, moIdx, rIdx },
    vertices: vertexCount, faceCount: faceCount / 3, textures, materials, bones, morphCount, endOffset: o,
  };
}

const buf = fs.readFileSync(file);
let best = null;
for (const mode of ["code", "bytes"]) {
  try {
    const r = parseModel(buf, mode);
    const ok =
      r.materials.length > 0 && r.materials.length < 200 &&
      r.bones.length > 0 && r.bones.length < 2000 &&
      r.textures.length < 500 &&
      r.morphCount >= 0 && r.morphCount < 5000;
    console.log(`[${mode}] bones=${r.bones.length} mats=${r.materials.length} tex=${r.textures.length} morphs=${r.morphCount} ok=${ok}`);
    if (ok) { best = { mode, r }; break; }
  } catch (e) {
    console.log(`[${mode}] failed: ${e.message}`);
  }
}

if (!best) {
  console.error("两种解释都失败");
  process.exit(1);
}

const r = best.r;
fs.writeFileSync(outPath, JSON.stringify(r, null, 1), "utf8");

const kw = /(スカーフ|マフラー|scarf|muffler|cloth|布|围巾|マフラ|ribbon|リボン|wrap|drape)/i;
const hit = r.bones.filter((b) => kw.test(b.name) || kw.test(b.en));

console.log(`\nmodel: ${r.name} / ${r.nameEn}  PMX ${r.version}  解析模式=${best.mode}`);
console.log(`sizes: v=${r.sizes.vIdx} t=${r.sizes.tIdx} m=${r.sizes.mIdx} b=${r.sizes.bIdx}`);
console.log(`vertices=${r.vertices} faces=${r.faceCount} textures=${r.textures.length} materials=${r.materials.length} bones=${r.bones.length} morphs=${r.morphCount}`);
console.log(`\n--- 围巾相关骨骼 (${hit.length}) ---`);
for (const b of hit) console.log(`  #${b.i} ${b.name} (${b.en}) parent=${b.parent} pos=[${b.pos.map((v) => v.toFixed(2)).join(", ")}]`);
console.log(`\n--- 材质 ---`);
for (const m of r.materials) console.log(`  tex=${m.texIdx} ${m.name}  faces=${m.surfaceCount}`);
console.log(`\nwritten: ${outPath}`);
