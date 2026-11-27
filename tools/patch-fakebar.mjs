import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");

// setProgress 只负责"真实进度文字"，进度条改由 70 秒的假进度驱动
s = s.replace(`/** 0-100，同时更新进度条、百分比与说明文字 */
function setProgress(pct: number, text?: string) {
  const v = Math.max(0, Math.min(100, pct));
  if (loadBar) loadBar.style.width = v.toFixed(1) + "%";
  if (loadPct) loadPct.textContent = Math.round(v) + "%";
  if (text && loadMsgEl) loadMsgEl.textContent = text;
}`,
`/**
 * 加载遮罩上的进度条故意做成"时间驱动"的假进度：
 * 首屏要下 25 MB 左右，慢网下真实进度会长时间卡在个位数，看起来像卡死。
 * 这里用 70 秒把条推到 99%，真正就绪时再瞬间补满。
 */
const FAKE_BAR_MS = 70_000;
let fakeBarRaf = 0;
let fakeBarDone = false;
const fakeBarStart = performance.now();

function paintBar(pct: number) {
  const v = Math.max(0, Math.min(100, pct));
  if (loadBar) loadBar.style.width = v.toFixed(1) + "%";
  if (loadPct) loadPct.textContent = Math.round(v) + "%";
}

function startFakeBar() {
  const tick = () => {
    if (fakeBarDone) return;
    const t = (performance.now() - fakeBarStart) / FAKE_BAR_MS;
    // 前段快、后段慢（ease-out），到 99% 停住等真实就绪
    const pct = Math.min(99, 99 * (1 - Math.pow(1 - Math.min(t, 1), 2.2)));
    paintBar(pct);
    fakeBarRaf = requestAnimationFrame(tick);
  };
  fakeBarRaf = requestAnimationFrame(tick);
}

/** 真实阶段只更新下方文字（这时条由假进度控制） */
function setProgress(_pct: number, text?: string) {
  if (text && loadMsgEl) loadMsgEl.textContent = text;
}

function finishBar() {
  fakeBarDone = true;
  if (fakeBarRaf) cancelAnimationFrame(fakeBarRaf);
  paintBar(100);
}

startFakeBar();`);

// 就绪时用 finishBar
s = s.replace(`      setProgress(100, "就绪");`, `      setProgress(0, "就绪");
      finishBar();`);

fs.writeFileSync(p, s, "utf8");
console.log("fake bar:", s.includes("FAKE_BAR_MS"), "| finish:", s.includes("function finishBar"));
