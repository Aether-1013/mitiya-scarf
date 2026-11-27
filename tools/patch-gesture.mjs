import fs from "node:fs";
const p = "src/vision/gesture.ts";
let s = fs.readFileSync(p, "utf8");

s = s.replace(`  fingerDirs: [],
  fingerCurl: [0, 0, 0, 0, 0],
};`, `  fingerDirs: [],
  fingerCurl: [0, 0, 0, 0, 0],
  basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },
};`);

s = s.replace(`  const up = norm(sub(world[9], world[0]));
  let side = norm(sub(world[17], world[5]));
  const normal = norm(cross(up, side));
  side = norm(cross(normal, up));`, `  const up = norm(sub(world[9], world[0]));
  let side = norm(sub(world[5], world[17])); // 小指 -> 食指
  const normal = norm(cross(up, side));
  side = norm(cross(normal, up));`);

s = s.replace(`    fingerDirs: smoothedDirs,
    fingerCurl,
  };`, `    fingerDirs: smoothedDirs,
    fingerCurl,
    basis: { s: side, u: up, n: normal },
  };`);

fs.writeFileSync(p, s, "utf8");
console.log("patched", s.includes("basis: { s: side"), s.includes("小指 -> 食指"));
