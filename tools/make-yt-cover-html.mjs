import fs from "node:fs";
let s = fs.readFileSync("shots/cover.html", "utf8");
// 复制一份 16:9 版本（YouTube 用），只改高度相关数值
let y = s
  .replace("width: 1280px;\n        height: 800px;", "width: 1280px;\n        height: 720px;")
  .replace("top: 104px;", "top: 74px;")
  .replace("height: 110%;", "height: 112%;")
  .replace("left: 96px; top: 272px;", "left: 88px; top: 232px;")
  .replace("font-size: 96px;", "font-size: 88px;")
  .replace("margin-top: 28px;", "margin-top: 24px;")
  .replace("left: 96px; bottom: 68px;", "left: 88px; bottom: 56px;")
  .replace("right: 54px; bottom: 44px;", "right: 48px; bottom: 34px;");
fs.writeFileSync("shots/cover_yt.html", y, "utf8");
console.log("cover_yt.html written");
