import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// DOM 引用 + setProgress
s = s.replace(`const gate = document.getElementById("gate") as HTMLDivElement;`,
`const gate = document.getElementById("gate") as HTMLDivElement;
const loadBar = document.getElementById("loadbar") as HTMLElement | null;
const loadPct = document.getElementById("loadpct") as HTMLElement | null;
const loadMsgEl = document.getElementById("loadmsg") as HTMLElement | null;

/** 0-100，同时更新进度条、百分比与说明文字 */
function setProgress(pct: number, text?: string) {
  const v = Math.max(0, Math.min(100, pct));
  if (loadBar) loadBar.style.width = v.toFixed(1) + "%";
  if (loadPct) loadPct.textContent = Math.round(v) + "%";
  if (text && loadMsgEl) loadMsgEl.textContent = text;
}`);

// 资源进度：模型下载占 0-70%，贴图占 70-100%
s = s.replace(`THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
  if (loaded === total) log(\`资源就绪 \${total}/\${total}\`, "ok");
  else if (loaded % 5 === 0) log(\`资源 \${loaded}/\${total}\`);
};`,
`THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
  // 模型本身也走这个 manager，所以贴图阶段用"占总数的比例"接在 70% 之后
  setProgress(70 + (loaded / Math.max(1, total)) * 30, \`贴图 \${loaded}/\${total}\`);
  if (loaded === total) log(\`资源就绪 \${total}/\${total}\`, "ok");
  else if (loaded % 5 === 0) log(\`资源 \${loaded}/\${total}\`);
};`);

// 原有的 onProgress → 走 setProgress
s = s.replace(`  (xhr) => {
    if (!xhr.total) return;
    const pct = Math.round((xhr.loaded / xhr.total) * 100);
    loadmsg.textContent = \`模型 \${pct}%（\${(xhr.loaded / 1048576).toFixed(1)} / \${(xhr.total / 1048576).toFixed(1)} MB）\`;
    if (pct % 20 === 0) log(\`模型下载 \${pct}%\`);
  },`,
`  (xhr) => {
    if (!xhr.total) {
      setProgress(0, \`模型下载中 \${(xhr.loaded / 1048576).toFixed(1)} MB\`);
      return;
    }
    const ratio = xhr.loaded / xhr.total;
    const pct = Math.round(ratio * 100);
    setProgress(
      ratio * 70,
      \`模型 \${pct}%（\${(xhr.loaded / 1048576).toFixed(1)} / \${(xhr.total / 1048576).toFixed(1)} MB）\`,
    );
    if (pct % 20 === 0) log(\`模型下载 \${pct}%\`);
  },`);

// 就绪时补满
s = s.replace(`      gate.classList.add("hide");
      document.body.dataset.ready = "1";`,
`      setProgress(100, "就绪");
      gate.classList.add("hide");
      document.body.dataset.ready = "1";`);

fs.writeFileSync(p, s, "utf8");
console.log("progress fn:", s.includes("function setProgress"), "| 70%:", s.includes("ratio * 70"), "| full:", s.includes('setProgress(100, "就绪")'));
