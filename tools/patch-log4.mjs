import fs from "node:fs";
const p = "src/ui/logPanel.ts";
let s = fs.readFileSync(p, "utf8");

// 位置上移，避免压住底部按钮
s = s.replace("position:fixed;left:14px;bottom:14px;z-index:60;width:min(94vw,360px);",
  "position:fixed;left:14px;bottom:72px;z-index:60;width:min(94vw,360px);");
s = s.replace("display:none;max-height:38vh;overflow:auto;padding:6px 10px 8px;",
  "display:none;max-height:34vh;overflow:auto;padding:6px 10px 8px;");

// 头部加"复制"按钮
s = s.replace(`    const caret = document.createElement("span");`,
`    const copyBtn = document.createElement("button");
    copyBtn.textContent = "复制";
    copyBtn.style.cssText =
      "margin-left:6px;padding:1px 7px;border-radius:6px;cursor:pointer;font:inherit;" +
      "background:rgba(168,123,255,0.18);border:1px solid rgba(168,123,255,0.35);color:#cfc2e6";
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = this.lines.join("\\n");
      navigator.clipboard?.writeText(text).then(
        () => { copyBtn.textContent = "已复制"; setTimeout(() => (copyBtn.textContent = "复制"), 1500); },
        () => { copyBtn.textContent = "复制失败"; setTimeout(() => (copyBtn.textContent = "复制"), 1500); },
      );
    });

    const caret = document.createElement("span");`);

s = s.replace("head.append(title, this.badge, this.status, caret);",
  "head.append(title, this.badge, this.status, copyBtn, caret);");

// 记录纯文本历史
s = s.replace("  private lines: string[] = [];", "  private lines: string[] = [];");
s = s.replace(`    row.textContent = \`\${t}s  \${msg}\`;`,
`    row.textContent = \`\${t}s  \${msg}\`;
    this.lines.push(\`\${t}s  \${msg}\`);`);

fs.writeFileSync(p, s, "utf8");
console.log("copy btn:", s.includes("copyBtn"), "| lines:", s.includes("this.lines.push"));
