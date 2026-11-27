/**
 * 按材质统计：包围盒、中心、面数、主导蒙皮骨骼。
 * 用来在 61 个材质里认出"围巾/飘带"那几块。
 */
import fs from "node:fs";
import { MMDParser } from "mmd-parser";

const file = process.argv[2] ?? "public/models/mitiya/MItya.pmx";
const d = fs.readFileSync(file);
const p = new MMDParser.Parser().parsePmx(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength));

const bones = p.bones ?? [];
const verts = p.vertices;
const faces = p.faces;

let cursor = 0;
const rows = [];

for (const mat of p.materials) {
  const n = mat.faceCount;
  if (!n) continue;
  const box = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const boneVotes = new Map();
  let vi = 0;

  for (let f = 0; f < n; f++) {
    const face = faces[cursor + f];
    for (const idx of face.indices) {
      const v = verts[idx];
      for (let a = 0; a < 3; a++) {
        if (v.position[a] < box.min[a]) box.min[a] = v.position[a];
        if (v.position[a] > box.max[a]) box.max[a] = v.position[a];
      }
      vi++;
      const dominant = v.skinIndices[v.skinWeights.indexOf(Math.max(...v.skinWeights))] ?? -1;
      if (dominant >= 0) boneVotes.set(dominant, (boneVotes.get(dominant) ?? 0) + 1);
    }
  }
  cursor += n;

  const center = box.min.map((mn, a) => (mn + box.max[a]) / 2);
  const size = box.min.map((mn, a) => box.max[a] - mn);
  const topBones = [...boneVotes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([bi, count]) => `${bones[bi]?.name ?? bi}(${count})`);

  rows.push({
    material: mat.name,
    tex: mat.textureIndex,
    faces: n / 3,
    center: center.map((v) => +v.toFixed(2)),
    size: size.map((v) => +v.toFixed(2)),
    bones: topBones,
  });
}

console.log("material".padEnd(26), "faces".padStart(6), "center(x,y,z)".padStart(22), "size(x,y,z)".padStart(20), "  dominant bones");
for (const r of rows) {
  console.log(
    r.material.padEnd(26),
    String(r.faces).padStart(6),
    r.center.map((v) => v.toFixed(1)).join(",").padStart(22),
    r.size.map((v) => v.toFixed(1)).join(",").padStart(20),
    "  " + r.bones.join(" "),
  );
}

fs.writeFileSync("assets_raw/materials.json", JSON.stringify(rows, null, 1), "utf8");
