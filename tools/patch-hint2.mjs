import fs from "node:fs";

// 文案：去掉和假进度冲突的百分比，只留真实字节数
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace(`    const ratio = xhr.loaded / xhr.total;
    setProgress(
      ratio * 70,
      \`模型 \${Math.round(ratio * 100)}%（\${(xhr.loaded / 1048576).toFixed(1)} / \${(xhr.total / 1048576).toFixed(1)} MB）\`,
    );`,
`    setProgress(
      0,
      \`模型 \${(xhr.loaded / 1048576).toFixed(1)} / \${(xhr.total / 1048576).toFixed(1)} MB\`,
    );`);
fs.writeFileSync("src/scarfview.ts", s, "utf8");

// 提示行排版
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace(`      .gate-hint {
        margin: 14px 0 0;
        font-size: 12px;
        line-height: 1.6;
        color: #8f83a8;
      }`,
`      .gate-hint {
        margin: 18px 0 0;
        font-size: 12px;
        line-height: 1.65;
        color: #8f83a8;
        text-align: center;
      }`);
fs.writeFileSync("scarf.html", h, "utf8");
console.log("text:", s.includes("模型 ${(xhr.loaded"), "| css:", h.includes("text-align: center"));
