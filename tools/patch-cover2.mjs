import fs from "node:fs";
const p = "shots/cover.html";
let s = fs.readFileSync(p, "utf8");

s = s.replace('<div class="kicker">HAND TRACKING · WEBGL</div>', '<div class="kicker">原神 · 米提亚</div>');
s = s.replace('<h1>打开摄像头<br /><em>围巾跟着你的手</em></h1>', '<h1>这条围巾<br /><em>会跟你猜拳</em></h1>');
s = s.replace('<div class="sub">手部动捕实时驱动 · 还能跟它猜拳<br />推理全在本地，画面不上传</div>',
  '<div class="sub">打开摄像头，它就跟着你的手动<br />还能跟它出石头剪刀布</div>');
s = s.replace(`<span class="tag">MediaPipe</span>
          <span class="tag">骨骼重定向</span>
          <span class="tag">原神模型</span>`,
  `<span class="tag">免安装</span>
          <span class="tag">手机也能玩</span>
          <span class="tag">画面不上传</span>`);
s = s.replace('<div class="url"><b>mitiya.pages.dev</b></div>', '<div class="url">来试试 → <b>mitiya.pages.dev</b></div>');

fs.writeFileSync(p, s, "utf8");
console.log("cover copy updated");
