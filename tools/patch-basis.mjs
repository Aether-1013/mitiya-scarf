import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 声明 modelBasis
s = s.replace("const UP_Y = new THREE.Vector3(0, 1, 0);",
  "const UP_Y = new THREE.Vector3(0, 1, 0);\n/** 手掌坐标系 (S,U,N) -> HandA01 局部轴 */\nconst modelBasis = new THREE.Matrix4();");

// 用 modelBasis 替换原来的单轴对齐
const oldAlign = `    // 用"第一段平均朝向"把动捕手掌坐标系对齐到模型手掌坐标系
    const measAvg = new THREE.Vector3();
    const modelAvg = new THREE.Vector3();
    for (let f = 0; f < fingers.length; f++) {
      const src = fingerMap[f] ?? 1;
      const d = fDirs[src];
      if (d?.[0]) measAvg.add(toV(d[0]));
      modelAvg.add(fingers[f].restDir[0].clone());
    }
    if (measAvg.lengthSq() < 1e-6) measAvg.set(0, 1, 0);
    if (modelAvg.lengthSq() < 1e-6) modelAvg.set(0, 1, 0);
    const align = new THREE.Quaternion().setFromUnitVectors(measAvg.normalize(), modelAvg.normalize());
`;
s = s.replace(oldAlign, "    const align = new THREE.Quaternion(); // 已由 modelBasis 承担\n");

s = s.replace(`        aim.copy(toV(dirs[j])).applyQuaternion(align).applyQuaternion(handWQ).normalize();
        cur.copy(fc.restDir[j]).applyQuaternion(w).normalize();`,
`        aim.copy(toV(dirs[j])).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();
        cur.copy(fc.restDir[j]).applyQuaternion(w).normalize();`);

s = s.replace(`        aim.copy(toV(dirs[j])).applyQuaternion(align).applyQuaternion(handWQ).normalize();
        const actual = fc.restDir[j].clone().applyQuaternion(worldQ[j]).normalize();`,
`        aim.copy(toV(dirs[j])).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();
        const actual = fc.restDir[j].clone().applyQuaternion(worldQ[j]).normalize();`);

fs.writeFileSync(p, s, "utf8");
console.log("applyMatrix4 count:", (s.match(/applyMatrix4\\(modelBasis\\)/g) || []).length);
