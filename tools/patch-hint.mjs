import fs from "node:fs";
let h = fs.readFileSync("scarf.html", "utf8");
h = h.replace("      .progress-meta b { color: #cfc2e6; font-weight: 600; }",
`      .progress-meta b { color: #cfc2e6; font-weight: 600; }
      .gate-hint {
        margin: 14px 0 0;
        font-size: 12px;
        line-height: 1.6;
        color: #8f83a8;
      }`);
fs.writeFileSync("scarf.html", h, "utf8");
console.log("hint css:", h.includes(".gate-hint"), "| hint html:", h.includes("30–60 秒"));
