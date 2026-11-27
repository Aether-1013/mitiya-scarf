import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");
s = s.replace("object-position: 72% 6%;", "object-position: 88% 4%;");
s = s.replace("font-size: 104px;", "font-size: 94px;");
s = s.replace("linear-gradient(102deg,\n            rgba(5,3,12,0.98) 0%,\n            rgba(5,3,12,0.94) 24%,\n            rgba(5,3,12,0.55) 46%,\n            rgba(5,3,12,0.08) 66%,\n            rgba(5,3,12,0) 78%)",
  "linear-gradient(102deg,\n            rgba(5,3,12,0.98) 0%,\n            rgba(5,3,12,0.95) 26%,\n            rgba(5,3,12,0.6) 48%,\n            rgba(5,3,12,0.15) 68%,\n            rgba(5,3,12,0) 80%)");
fs.writeFileSync(p, s, "utf8");
console.log("ok", s.includes("88% 4%"), s.includes("94px"));
