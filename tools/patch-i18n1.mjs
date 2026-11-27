import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// ---- 引入 i18n ----
s = s.replace('import { log, logPanel } from "./ui/logPanel";',
  'import { log, logPanel } from "./ui/logPanel";\nimport { t, setLang, lang, onLangChange, initI18n } from "./ui/i18n";\ninitI18n();');

// ---- 模式切换文案 ----
s = s.replace(`  if (modeBtnEl) modeBtnEl.textContent = gameMode ? "切到动捕" : "切到猜拳";
  statusEl.textContent = gameMode ? "猜拳模式（只跟位置）" : "动捕模式（须子跟手）";`,
`  if (modeBtnEl) modeBtnEl.textContent = t(gameMode ? "btnToMirror" : "btnToGame");
  statusEl.textContent = t(gameMode ? "modeGame" : "modeMirror");
  if (chipHintEl) chipHintEl.textContent = t(gameMode ? "chipHintGame" : "chipHintMirror");
  if (chipModeEl) chipModeEl.textContent = t(gameMode ? "chipModeGame" : "chipModeMirror");`);

s = s.replace(`  if (chipHintEl) chipHintEl.textContent = gameMode ? "做手势 → 围巾回应（石头 / 剪刀 / 布）" : "做手势 → 围巾跟着你动";
  if (chipModeEl) chipModeEl.textContent = gameMode ? "围巾只跟随位置，手型由它自己决定" : "须子会跟随你的手指方向";
`, "");

s = s.replace(`if (rpsStartEl) rpsStartEl.textContent = "重置比分";`, `if (rpsStartEl) rpsStartEl.textContent = t("btnResetScore");`);

s = s.replace(`const RESULT_CN = { win: "你赢了", lose: "围巾赢了", draw: "平手" } as const;`,
`const RESULT_KEY = { win: "resultWin", lose: "resultLose", draw: "resultDraw" } as const;`);

// ---- HUD 文本 ----
s = s.replace('      `你 ${RPS_CN[game.playerPick]} · 围巾 ${RPS_CN[game.scarfPick]}<br>` +\n      `<span class="${game.result}">${RESULT_CN[game.result]}</span>`;',
'      `${t("youThrew")} ${t(game.playerPick)} · ${t("scarfThrew")} ${t(game.scarfPick)}<br>` +\n      `<span class="${game.result}">${t(RESULT_KEY[game.result])}</span>`;');
s = s.replace('const want = game.rounds === 0 ? "做个手势（石头 / 剪刀 / 布）" : "";',
  'const want = game.rounds === 0 ? t("gesturePrompt") : "";');
s = s.replace('  const sc = `你 ${game.score.win} : ${game.score.lose} 围巾`;',
  '  const sc = `${t("scoreYou")} ${game.score.win} : ${game.score.lose} ${t("scoreScarf")}`;');

// ---- 摄像头 ----
s = s.replace('camBtn.textContent = "开启中…";', 'camBtn.textContent = t("btnCamStarting");');
s = s.replace('    "启动手部动捕",\n    "下载推理引擎与动捕模型，大约 10–30 秒（视网速）",',
  '    t("gateTracking"),\n    t("gateTrackingHint"),');
s = s.replace('statusEl.textContent = "摄像头追踪中";', 'statusEl.textContent = t("statusTracking");');
s = s.replace('if (camBtn) camBtn.textContent = "摄像头已开";', 'if (camBtn) camBtn.textContent = t("btnCamDone");');
s = s.replace('camBtn.textContent = "重试摄像头";', 'camBtn.textContent = t("btnCamRetry");');
s = s.replace('setProgress(0, "就绪");', 'setProgress(0, t("statusReady"));');
s = s.replace('setProgress(0, "模型加载失败，看左下角日志");', 'setProgress(0, t("gateFailed"));');
s = s.replace('if (loadMsgEl) loadMsgEl.textContent = "准备中…";', 'if (loadMsgEl) loadMsgEl.textContent = t("gatePreparing");');

// ---- 日志状态行 ----
s = s.replace('const handTxt = useCamera ? (hand.present ? "手 ✓" : "手 ✗") : "未开摄像头";',
  'const handTxt = useCamera ? (hand.present ? t("logHandOk") : t("logHandNo")) : t("logNoCam");');

fs.writeFileSync(p, s, "utf8");
console.log("i18n wired:", s.includes('t("youThrew")'), s.includes('t("gateTracking")'), s.includes('t("logNoCam")'));
