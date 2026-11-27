/**
 * 用 mmd-parser 解析 PMX，列出骨骼 / 材质 / 贴图，定位围巾骨骼。
 * 用法：node tools/pmx-info.mjs <file.pmx> [out.json]
 */
import fs from "node:fs";
import { MMDParser } from "mmd-parser";

const file = process.argv[2];
const outPath = process.argv[3] ?? "assets_raw/pmx.json";

const data = fs.readFileSync(file);
const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
const parsed = new MMDParser.Parser().parsePmx(buffer);

const bones = parsed.bones.map((b, i) => ({
  i,
  name: b.name,
  en: b.englishName,
  parent: b.parentIndex,
  pos: b.position,
  flag: b.flag,
}));

const report = {
  name: parsed.metadata?.modelName,
  en: parsed.metadata?.englishModelName,
  vertices: parsed.vertices.length / 8,
  faces: parsed.faces.length / 3,
  textures: parsed.metadata?.textures ?? [],
  materials: parsed.materials.map((m) => ({
    name: m.name,
    en: m.englishName,
    textureIndex: m.textureIndex,
    faceCount: m.faceCount,
  })),
  bones,
  morphs: parsed.morphs?.length ?? 0,
  rigidBodies: parsed.rigidBodies?.length ?? 0,
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 1), "utf8");

const kw = /(スカーフ|マフラー|scarf|muffler|cloth|布|围巾|ribbon|リボン|cape|マント|stole|shawl|ネクタイ|tie)/i;
const hit = bones.filter((b) => kw.test(b.name ?? "") || kw.test(b.en ?? ""));

console.log(`model: ${report.name} / ${report.en}`);
console.log(
  `vertices=${report.vertices} faces=${report.faces} materials=${report.materials.length} textures=${report.textures.length} bones=${bones.length} morphs=${report.morphs} rigidBodies=${report.rigidBodies}`,
);

console.log(`\n--- 材质 ---`);
for (const m of report.materials) console.log(`  tex=${m.textureIndex}\t${m.name}\t${m.faceCount} faces`);

console.log(`\n--- 贴图 (${report.textures.length}) ---`);
report.textures.forEach((t, i) => console.log(`  [${i}] ${t}`));

console.log(`\n--- 围巾相关骨骼 (${hit.length}) ---`);
for (const b of hit) {
  console.log(`  #${b.i} ${b.name} | ${b.en} | parent=${b.parent} pos=[${b.pos.map((v) => v.toFixed(2)).join(", ")}]`);
}

console.log(`\n--- 前 45 根骨骼 ---`);
for (const b of bones.slice(0, 45)) console.log(`  #${b.i} ${b.name} | ${b.en} | parent=${b.parent}`);

console.log(`\nwritten: ${outPath}`);
