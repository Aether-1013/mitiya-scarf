/**
 * 极简 i18n：只有中/英两种语言。
 * 语言来源优先级：?lang= → localStorage → 浏览器语言 → 中文。
 */
export type Lang = "zh" | "en";

const DICT = {
  zh: {
    title: "围巾",
    kicker: "SCARF ONLY",
    statusLoading: "加载中…",
    statusReady: "就绪",
    statusTracking: "摄像头追踪中",
    statusCameraFail: "摄像头不可用",

    chipHintMirror: "做手势 → 围巾跟着你动",
    chipHintGame: "做手势 → 围巾回应（石头 / 剪刀 / 布）",
    chipModeMirror: "须子会跟随你的手指方向",
    chipModeGame: "围巾只跟随位置，手型由它自己决定",

    btnToGame: "切到猜拳",
    btnToMirror: "切到动捕",
    btnCamOn: "开启摄像头",
    btnCamStarting: "开启中…",
    btnCamDone: "摄像头已开",
    btnCamRetry: "重试摄像头",
    btnStartRps: "开始猜拳",
    btnResetScore: "重置比分",
    btnLang: "EN",

    modeMirror: "动捕模式（须子跟手）",
    modeGame: "猜拳模式（只跟位置）",

    scoreYou: "你",
    scoreScarf: "围巾",
    resultWin: "你赢了",
    resultLose: "围巾赢了",
    resultDraw: "平手",
    gesturePrompt: "做个手势（石头 / 剪刀 / 布）",
    youThrew: "你出",
    scarfThrew: "围巾出",

    rock: "石头",
    scissors: "剪刀",
    paper: "布",

    gateLoading: "切出围巾",
    gateHint: "首次加载需要下载模型并初始化，大约 30–60 秒（视网速）",
    gateTracking: "启动手部动捕",
    gateTrackingHint: "下载推理引擎与动捕模型，大约 10–30 秒（视网速）",
    gatePreparing: "准备中…",
    gateFailed: "模型加载失败，看左下角日志",

    logTitle: "日志",
    logCopy: "复制",
    logCopied: "已复制",
    logNoCam: "未开摄像头",
    logHandOk: "手 ✓",
    logHandNo: "手 ✗",
  },
  en: {
    title: "Scarf",
    kicker: "SCARF ONLY",
    statusLoading: "Loading…",
    statusReady: "Ready",
    statusTracking: "Hand tracking",
    statusCameraFail: "Camera unavailable",

    chipHintMirror: "Move your hand → the scarf follows",
    chipHintGame: "Move your hand → it plays back",
    chipModeMirror: "Tips follow your finger directions",
    chipModeGame: "Position only — shapes are its own",

    btnToGame: "Rock-paper-scissors",
    btnToMirror: "Back to mirror",
    btnCamOn: "Enable camera",
    btnCamStarting: "Starting…",
    btnCamDone: "Camera on",
    btnCamRetry: "Retry camera",
    btnStartRps: "Start",
    btnResetScore: "Reset score",
    btnLang: "中",

    modeMirror: "Mirror mode (tips follow your hand)",
    modeGame: "RPS mode (position only)",

    scoreYou: "You",
    scoreScarf: "Scarf",
    resultWin: "You win",
    resultLose: "Scarf wins",
    resultDraw: "Draw",
    gesturePrompt: "Throw something (rock / scissors / paper)",
    youThrew: "You",
    scarfThrew: "Scarf",

    rock: "Rock",
    scissors: "Scissors",
    paper: "Paper",

    gateLoading: "Unrolling the scarf",
    gateHint: "First load downloads the model — about 30–60 seconds, depending on your connection",
    gateTracking: "Starting hand tracking",
    gateTrackingHint: "Downloading the inference engine and hand model — about 10–30 seconds",
    gatePreparing: "Preparing…",
    gateFailed: "Model failed to load — check the log at the bottom left",

    logTitle: "Log",
    logCopy: "Copy",
    logCopied: "Copied",
    logNoCam: "camera off",
    logHandOk: "hand ✓",
    logHandNo: "hand ✗",
  },
} as const;

export type MsgKey = keyof (typeof DICT)["zh"];

const STORE_KEY = "mitiya.lang";

function detect(): Lang {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "zh" || q === "en") return q;
  const saved = localStorage.getItem(STORE_KEY);
  if (saved === "zh" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let current: Lang = detect();
const listeners: ((l: Lang) => void)[] = [];

export function lang(): Lang {
  return current;
}

/** 日志/动态文案的临时双语文案 */
export function L(zh: string, en: string): string {
  return current === "zh" ? zh : en;
}

export function t(key: MsgKey): string {
  return DICT[current][key];
}

export function onLangChange(cb: (l: Lang) => void) {
  listeners.push(cb);
}

export function setLang(l: Lang) {
  current = l;
  localStorage.setItem(STORE_KEY, l);
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  for (const cb of listeners) cb(l);
  applyStatic();
}

/** 把带 data-i18n 的静态节点刷成当前语言 */
export function applyStatic() {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as MsgKey;
    if (key && key in DICT[current]) el.textContent = DICT[current][key];
  });
}

export function initI18n() {
  document.documentElement.lang = current === "zh" ? "zh-CN" : "en";
  applyStatic();
}
