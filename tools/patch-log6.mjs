import fs from "node:fs";
const p = "src/ui/logPanel.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace('"flex:none;margin-left:4px;padding:2px 8px;border-radius:6px;cursor:pointer;font:inherit;white-space:nowrap;" +',
  '"width:auto;display:inline-block;flex:none;margin:0 0 0 4px;padding:2px 8px;border-radius:6px;" +\n      "cursor:pointer;font:inherit;white-space:nowrap;line-height:1.4;" +');
fs.writeFileSync(p, s, "utf8");
console.log("btn width auto:", s.includes("width:auto;display:inline-block"));
