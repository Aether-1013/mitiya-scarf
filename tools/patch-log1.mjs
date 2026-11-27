import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// 1) 引入
s = s.replace('import { POSES } from "./game/poses";',
  'import { POSES } from "./game/poses";\nimport { log, logPanel } from "./ui/logPanel";');

// 2) 模型加载进度 + 贴图进度
s = s.replace(`const loader = new MMDLoader();
loader.load("/models/mitiya/MItya.pmx", (data) => {`,
`THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
  if (loaded === total) log(\`资源就绪 \${total}/\${total}\`, "ok");
  else if (loaded % 5 === 0) log(\`资源 \${loaded}/\${total}\`);
};
THREE.DefaultLoadingManager.onError = (url) => {
  log(\`资源 404：\${url.split("/").slice(-2).join("/")}\`, "error");
};

log("开始加载模型 MItya.pmx（3.7 MB）");
const loader = new MMDLoader();
loader.load("/models/mitiya/MItya.pmx", (data) => {
  log("模型解析完成", "ok");`);

// 3) load 的 onProgress / onError
s = s.replace(`  (xhr) => {
    if (xhr.total) loadmsg.textContent = \`\${Math.round((xhr.loaded / xhr.total) * 100)}%\`;
  },
  (err) => console.error(err),`,
`  (xhr) => {
    if (!xhr.total) return;
    const pct = Math.round((xhr.loaded / xhr.total) * 100);
    loadmsg.textContent = \`模型 \${pct}%（\${(xhr.loaded / 1048576).toFixed(1)} / \${(xhr.total / 1048576).toFixed(1)} MB）\`;
    if (pct % 20 === 0) log(\`模型下载 \${pct}%\`);
  },
  (err) => {
    log(\`模型加载失败：\${String(err)}\`, "error");
    loadmsg.textContent = "模型加载失败，看左下角日志";
  },`);

fs.writeFileSync(p, s, "utf8");
console.log("model progress:", s.includes("模型下载"), "| manager:", s.includes("DefaultLoadingManager.onProgress"));
