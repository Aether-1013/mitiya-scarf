import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

s = s.replace("const view = { az: 0.0, el: 0.03, r: tune.viewR, ty: tune.viewTy };",
  "const view = { az: 0.0, el: 0.03, r: tune.viewR, ty: tune.viewTy, tx: 0 };");
s = s.replace(`  const { az, el, r, ty } = view;
  camera.position.set(Math.sin(az) * Math.cos(el) * r, ty + Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
  camera.lookAt(0, ty, 0);`,
`  const { az, el, r, ty, tx } = view;
  camera.position.set(tx + Math.sin(az) * Math.cos(el) * r, ty + Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
  camera.lookAt(tx, ty, 0);`);
// 录屏模式：相机左移，让围巾在画面里靠右（不碰 IK）
s = s.replace("  view.r = 17.5;\n  view.ty = 9.2;", "  view.r = 17.5;\n  view.ty = 9.2;\n  view.tx = -3.4;");
fs.writeFileSync(p, s, "utf8");
console.log("view.tx:", s.includes("tx: 0"), "| reel tx:", s.includes("view.tx = -3.4"));
