import fs from "node:fs";

// 1) i18n 增加一个 L(zh, en) 便捷函数
let i = fs.readFileSync("src/ui/i18n.ts", "utf8");
if (!i.includes("export function L(")) {
  i = i.replace("export function t(key: MsgKey): string {",
`/** 日志/动态文案的临时双语文案 */
export function L(zh: string, en: string): string {
  return current === "zh" ? zh : en;
}

export function t(key: MsgKey): string {`);
  fs.writeFileSync("src/ui/i18n.ts", i, "utf8");
}

// 2) hand.ts 的进度提示
let h = fs.readFileSync("src/vision/hand.ts", "utf8");
h = h.replace('onProgress?.("加载推理引擎…");', 'onProgress?.(L("加载推理引擎…", "Loading inference engine…"));');
h = h.replace('onProgress?.("加载手部模型…");', 'onProgress?.(L("加载手部模型…", "Loading hand model…"));');
if (!h.includes('from "../ui/i18n"')) {
  h = h.replace(/^(import .*\n)/, '$1import { L } from "../ui/i18n";\n');
}
fs.writeFileSync("src/vision/hand.ts", h, "utf8");
console.log("hand.ts:", h.includes("Loading hand model"), "| import:", h.includes('ui/i18n'));

// 3) scarfview 的日志文案
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace('import { t, setLang, lang, onLangChange, initI18n } from "./ui/i18n";',
  'import { t, L, setLang, lang, onLangChange, initI18n } from "./ui/i18n";');
const pairs = [
  ['log("开始加载模型 MItya.pmx（3.7 MB）");', 'log(L("开始加载模型 MItya.pmx（3.7 MB）", "Loading MItya.pmx (3.7 MB)"));'],
  ['log("模型解析完成", "ok");', 'log(L("模型解析完成", "Model parsed"), "ok");'],
  ['log(`资源就绪 ${total}/${total}`, "ok");', 'log(L(`资源就绪 ${total}/${total}`, `Assets ready ${total}/${total}`), "ok");'],
  ['log(`资源 ${loaded}/${total}`);', 'log(L(`资源 ${loaded}/${total}`, `Assets ${loaded}/${total}`));'],
  ['log("请求摄像头权限…");', 'log(L("请求摄像头权限…", "Requesting camera permission…"));'],
  ['log("检测到手 ✓", "ok");', 'log(L("检测到手 ✓", "Hand detected ✓"), "ok");'],
  ['log("手离开画面", "warn");', 'log(L("手离开画面", "Hand left the frame"), "warn");'],
  ['log(`摄像头就绪 ${video.videoWidth}x${video.videoHeight}`, "ok");', 'log(L(`摄像头就绪 ${video.videoWidth}x${video.videoHeight}`, `Camera ready ${video.videoWidth}x${video.videoHeight}`), "ok");'],
  ['log("这个浏览器没有 getUserMedia（常见：非 HTTPS、或微信/QQ 内置浏览器）", "error");', 'log(L("这个浏览器没有 getUserMedia（常见：非 HTTPS、或微信/QQ 内置浏览器）", "This browser has no getUserMedia (usually: not HTTPS, or an in-app browser)"), "error");'],
  ['log(`推理引擎就绪（${tracker.delegate}），开始追踪`, "ok");', 'log(L(`推理引擎就绪（${tracker.delegate}），开始追踪`, `Engine ready (${tracker.delegate}), tracking`), "ok");'],
];
let n = 0;
for (const [from, to] of pairs) { if (s.includes(from)) { s = s.replace(from, to); n++; } }
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("scarfview log strings converted:", n, "/", pairs.length);
