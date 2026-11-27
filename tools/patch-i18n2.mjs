import fs from "node:fs";
let h = fs.readFileSync("scarf.html", "utf8");

h = h.replace('<h1>围巾</h1>', '<h1 data-i18n="title">围巾</h1>');
h = h.replace('<div class="sub" id="status">加载中…</div>', '<div class="sub" id="status" data-i18n="statusLoading">加载中…</div>');
h = h.replace('<button id="modeBtn" class="chipBtn">切到猜拳</button>',
  '<button id="modeBtn" class="chipBtn">切到猜拳</button>\n          <button id="langBtn" class="chipBtn">EN</button>');
h = h.replace('<h2>切出围巾</h2>', '<h2 data-i18n="gateLoading">切出围巾</h2>');
h = h.replace('<span id="loadmsg">准备中…</span>', '<span id="loadmsg" data-i18n="gatePreparing">准备中…</span>');
h = h.replace('<p class="gate-hint">首次加载需要下载模型并初始化，大约 30–60 秒（视网速）</p>',
  '<p class="gate-hint" data-i18n="gateHint">首次加载需要下载模型并初始化，大约 30–60 秒（视网速）</p>');
h = h.replace('<span class="chip" id="chipHint">做手势 → 围巾跟着你动</span>',
  '<span class="chip" id="chipHint" data-i18n="chipHintMirror">做手势 → 围巾跟着你动</span>');
h = h.replace('<span class="chip" id="chipMode">须子会跟随你的手指方向</span>',
  '<span class="chip" id="chipMode" data-i18n="chipModeMirror">须子会跟随你的手指方向</span>');
fs.writeFileSync("scarf.html", h, "utf8");
console.log("html:", ["data-i18n=\"title\"", "langBtn", "gateHint"].map(k => h.includes(k)).join(","));

let s = fs.readFileSync("src/scarfview.ts", "utf8");
// 语言按钮 + 切换后的刷新
s = s.replace(`modeBtnEl?.addEventListener("click", () => {`,
`const langBtnEl = document.getElementById("langBtn") as HTMLButtonElement | null;
function refreshLang() {
  if (langBtnEl) langBtnEl.textContent = t("btnLang");
  applyMode();
  if (rpsStartEl) rpsStartEl.textContent = t("btnResetScore");
  if (camBtn && !useCamera) camBtn.textContent = t("btnCamOn");
}
langBtnEl?.addEventListener("click", () => {
  setLang(lang() === "zh" ? "en" : "zh");
  refreshLang();
});
onLangChange(() => refreshLang());
if (langBtnEl) langBtnEl.textContent = t("btnLang");

modeBtnEl?.addEventListener("click", () => {`);
fs.writeFileSync("src/scarfview.ts", s, "utf8");
console.log("langBtn wired:", s.includes("langBtnEl"));
