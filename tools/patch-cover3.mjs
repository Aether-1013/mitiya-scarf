import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");
s = s.replace('<h1>这条围巾<br /><em>会跟你猜拳</em></h1>', '<h1>这条围巾<br /><em>会跟着你动</em></h1>');
s = s.replace('<div class="sub">打开摄像头，它就跟着你的手动<br />还能跟它出石头剪刀布</div>',
  '<div class="sub">抬手它就过来，握拳它就卷起来<br />打开摄像头就行，不用装东西</div>');
fs.writeFileSync(p, s, "utf8");
console.log("cover v3 updated");
