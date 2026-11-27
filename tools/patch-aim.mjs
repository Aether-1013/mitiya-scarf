import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 在 modelBasis 建好后缓存逆矩阵
s = s.replace("const modelBasis = new THREE.Matrix4();",
  "const modelBasis = new THREE.Matrix4();\nconst modelBasisInv = new THREE.Matrix4();\nconst U_AXIS = new THREE.Vector3(0, 1, 0);");

s = s.replace(`    console.log("BASIS", JSON.stringify({ s: Sw.toArray(), u: Uw.toArray(), fingers: fingers.length }));`,
`    modelBasisInv.copy(modelBasis).invert();
    console.log("BASIS", JSON.stringify({ s: Sw.toArray(), u: Uw.toArray(), fingers: fingers.length }));`);

// 新的 aim 计算：restDir 先转到 (S,U,N) 基，施加"相对伸直的偏转"，再转回来
const newAim = (indent) => `${indent}const dMeas = toV(dirs[j]);
${indent}const delta = new THREE.Quaternion().setFromUnitVectors(U_AXIS, dMeas);
${indent}const rdBasis = fc.restDir[j].clone().applyMatrix4(modelBasisInv).normalize();
${indent}aim.copy(rdBasis).applyQuaternion(delta).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();`;

s = s.replace(`        aim.copy(toV(dirs[j])).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();
        cur.copy(fc.restDir[j]).applyQuaternion(w).normalize();`,
newAim("        ") + `
        cur.copy(fc.restDir[j]).applyQuaternion(w).normalize();`);

s = s.replace(`        aim.copy(toV(dirs[j])).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();
        const actual = fc.restDir[j].clone().applyQuaternion(worldQ[j]).normalize();`,
newAim("        ") + `
        const actual = fc.restDir[j].clone().applyQuaternion(worldQ[j]).normalize();`);

fs.writeFileSync(p, s, "utf8");
console.log("patched aims:", (s.match(/rdBasis/g) || []).length);
