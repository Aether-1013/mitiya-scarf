import fs from "node:fs";
let s = fs.readFileSync("src/ui/logPanel.ts", "utf8");
s = s.replace('import { log, logPanel } from "./ui/logPanel";', '');
s = s.replace('export type LogLevel = "info" | "ok" | "warn" | "error";',
  'import { t, onLangChange } from "./i18n";\n\nexport type LogLevel = "info" | "ok" | "warn" | "error";');
s = s.replace('title.textContent = "日志";', 'title.textContent = t("logTitle");');
s = s.replace('copyBtn.textContent = "复制";', 'copyBtn.textContent = t("logCopy");');
s = s.replace('() => { copyBtn.textContent = "已复制"; setTimeout(() => (copyBtn.textContent = "复制"), 1500); },',
  '() => { copyBtn.textContent = t("logCopied"); setTimeout(() => (copyBtn.textContent = t("logCopy")), 1500); },');
s = s.replace('() => { copyBtn.textContent = "复制失败"; setTimeout(() => (copyBtn.textContent = "复制"), 1500); },',
  '() => { copyBtn.textContent = t("logCopy"); },');
s = s.replace('    window.addEventListener("keydown", (e) => {',
  '    onLangChange(() => { title.textContent = t("logTitle"); copyBtn.textContent = t("logCopy"); });\n\n    window.addEventListener("keydown", (e) => {');
fs.writeFileSync("src/ui/logPanel.ts", s, "utf8");
console.log("logPanel i18n:", s.includes('t("logTitle")'), s.includes("onLangChange"));
