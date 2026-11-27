import fs from "node:fs";
const p = "src/ui/logPanel.ts";
let s = fs.readFileSync(p, "utf8");

s = s.replace('display:flex;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;',
  'display:flex;align-items:center;gap:6px;padding:7px 10px;cursor:pointer;flex-wrap:nowrap;');
s = s.replace('title.style.cssText = "color:#a87bff;font-weight:700;letter-spacing:.06em";',
  'title.style.cssText = "color:#a87bff;font-weight:700;letter-spacing:.06em;white-space:nowrap;flex:none";');
s = s.replace('this.status.style.cssText = "margin-left:auto;color:#7d728f";',
  'this.status.style.cssText = "margin-left:auto;color:#7d728f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0";');
s = s.replace('"margin-left:6px;padding:1px 7px;border-radius:6px;cursor:pointer;font:inherit;" +',
  '"flex:none;margin-left:4px;padding:2px 8px;border-radius:6px;cursor:pointer;font:inherit;white-space:nowrap;" +');

fs.writeFileSync(p, s, "utf8");
console.log("nowrap:", s.includes("flex-wrap:nowrap"), "| btn:", s.includes("flex:none;margin-left:4px"));
