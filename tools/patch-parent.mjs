import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 1) Finger 增加 parentIdx
s = s.replace("  /** 三段的静止方向（父骨坐标系下） */\n  restDir: THREE.Vector3[];\n};",
  "  /** 三段的静止方向（父骨坐标系下） */\n  restDir: THREE.Vector3[];\n  /** 父骨在 backbone 里的下标（A 挂 SplineIK06，B/C/D 挂 HandA01） */\n  parentIdx: number;\n};");

// 2) 构建时记录
s = s.replace(`      restDir: [
        arr[1].position.clone().normalize(),
        arr[2].position.clone().normalize(),
        new THREE.Vector3(0, 1, 0),
      ],`,
`      restDir: [
        arr[1].position.clone().normalize(),
        arr[2].position.clone().normalize(),
        new THREE.Vector3(0, 1, 0),
      ],
      parentIdx: backbone.indexOf(arr[0].parent as THREE.Bone),`);

// 3) 用父骨朝向替代固定的 handWQ
s = s.replace(`      let w = handWQ.clone();`,
`      const pi = fc.parentIdx;
      const parentWorld = pi === n - 1 || pi < 0 ? handWQ.clone() : wq[pi].clone();
      let w = parentWorld.clone();`);

s = s.replace(`      const parents = [handWQ, worldQ[0], worldQ[1]];`,
`      const parents = [parentWorld, worldQ[0], worldQ[1]];`);

// 4) 弯曲上限放宽到 0.85（≈49°/关节）
s = s.replace("maxJoint: 0.5, // 单个关节最大弯曲（弧度，≈29°）",
  "maxJoint: 0.85, // 单个关节最大弯曲（弧度，≈49°）");

fs.writeFileSync(p, s, "utf8");
console.log("parentIdx:", s.includes("parentIdx"), "| parents:", s.includes("[parentWorld"), "| maxJoint:", s.includes("0.85"));
