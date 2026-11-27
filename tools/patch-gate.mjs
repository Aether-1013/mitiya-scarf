import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 纹理真正载入后再隐藏遮罩，避免用户看到空场景
s = s.replace(`  statusEl.textContent = \`\${(tris.length || indices.length) / 3} 面 · \${backbone.length} 骨\`;`,
`  statusEl.textContent = \`\${(tris.length || indices.length) / 3} 面 · \${backbone.length} 骨\`;

  // 贴图是异步的：等第一张贴图解码完成再收起遮罩，否则会看到空场景
  let waited = 0;
  const showWhenTextured = () => {
    waited += 150;
    const texReady = used.some((m) => !!(m as { map?: { image?: unknown } }).map?.image);
    if (texReady || waited > 15000) {
      buildBoneVis();
      if (boneVis.visible) {
        for (const m of used) {
          m.transparent = true;
          m.opacity = 0.3;
          m.depthWrite = false;
        }
      }
      gate.classList.add("hide");
      document.body.dataset.ready = "1";
    } else {
      setTimeout(showWhenTextured, 150);
    }
  };
  showWhenTextured();
  void 0;`);

// 旧的"立即 ready"改成不写，避免覆盖
s = s.replace(`  gate.classList.add("hide");
  document.body.dataset.ready = "1";

  (window as unknown as { __scarf: unknown }).__scarf = {`,
`  (window as unknown as { __scarf: unknown }).__scarf = {`);

fs.writeFileSync(p, s, "utf8");
console.log("textured gate:", s.includes("showWhenTextured"));
