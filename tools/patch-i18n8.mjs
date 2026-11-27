import fs from "node:fs";
let s = fs.readFileSync("src/ui/logPanel.ts", "utf8");
s = s.replace('import { t, onLangChange } from "./i18n";', 'import { t, L, onLangChange } from "./i18n";');
const pairs = [
  ['this.log(`页面：${location.host}${location.pathname}`, "info");', 'this.log(L(`页面：${location.host}${location.pathname}`, `Page: ${location.host}${location.pathname}`), "info");'],
  ['this.log(`安全上下文：${window.isSecureContext ? "是（可开摄像头）" : "否（http 下摄像头不可用）"}`,\n      window.isSecureContext ? "ok" : "error");',
   'this.log(\n      L(\n        `安全上下文：${window.isSecureContext ? "是（可开摄像头）" : "否（http 下摄像头不可用）"}`,\n        `Secure context: ${window.isSecureContext ? "yes (camera allowed)" : "no (camera blocked on http)"}`,\n      ),\n      window.isSecureContext ? "ok" : "error",\n    );'],
  ['this.log(`摄像头 API：${hasGum ? "可用" : "不存在"}`, hasGum ? "ok" : "error");',
   'this.log(L(`摄像头 API：${hasGum ? "可用" : "不存在"}`, `Camera API: ${hasGum ? "available" : "missing"}`), hasGum ? "ok" : "error");'],
  ['this.log(`WebGL：${gl}`, "info");', 'this.log(`WebGL: ${gl}`, "info");'],
  ['this.log(`UA：${navigator.userAgent.slice(0, 120)}`, "info");', 'this.log(`UA: ${navigator.userAgent.slice(0, 120)}`, "info");'],
  ['for (const [k, v] of Object.entries(extra)) this.log(`${k}：${v}`, "info");', 'for (const [k, v] of Object.entries(extra)) this.log(`${k}: ${v}`, "info");'],
];
let n = 0;
for (const [from, to] of pairs) { if (s.includes(from)) { s = s.replace(from, to); n++; } }
fs.writeFileSync("src/ui/logPanel.ts", s, "utf8");
console.log("logPanel strings:", n, "/", pairs.length);

// scarfview 里 logEnv 的键名
let v = fs.readFileSync("src/scarfview.ts", "utf8");
v = v.replace('logPanel.logEnv({ 构建: "pages/" + (location.host.includes("pages.dev") ? "cloudflare" : "local") });',
  'logPanel.logEnv({ [lang() === "zh" ? "构建" : "Build"]: "pages/" + (location.host.includes("pages.dev") ? "cloudflare" : "local") });');
fs.writeFileSync("src/scarfview.ts", v, "utf8");
console.log("env key:", v.includes('lang() === "zh" ? "构建"'));
