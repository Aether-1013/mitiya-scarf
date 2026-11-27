/**
 * 屏幕上的日志面板：把关键事件、报错、下载进度直接打给用户看。
 * 默认收起，出现 error 时自动展开；按 L 或点标题栏切换。
 */
import { t, L, onLangChange } from "./i18n";

export type LogLevel = "info" | "ok" | "warn" | "error";

const COLOR: Record<LogLevel, string> = {
  info: "#b6a6cc",
  ok: "#7ef0d0",
  warn: "#f2d18a",
  error: "#ff8ba0",
};

class LogPanel {
  private root: HTMLDivElement;
  private body: HTMLDivElement;
  private badge: HTMLSpanElement;
  private status: HTMLSpanElement;
  private open = false;
  private counts = { total: 0, error: 0 };
  private start = performance.now();
  private lines: string[] = [];

  constructor() {
    this.root = document.createElement("div");
    this.root.id = "logPanel";
    this.root.style.cssText = `
      position:fixed;left:14px;bottom:72px;z-index:60;width:min(94vw,360px);
      font:11px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;
      background:rgba(10,7,20,0.90);border:1px solid rgba(168,123,255,0.28);
      border-radius:10px;color:#cfc2e6;backdrop-filter:blur(10px);
      box-shadow:0 10px 34px rgba(0,0,0,0.55);overflow:hidden;`;

    const head = document.createElement("div");
    head.style.cssText = `
      display:flex;align-items:center;gap:6px;padding:7px 10px;cursor:pointer;flex-wrap:nowrap;
      background:rgba(168,123,255,0.10);border-bottom:1px solid rgba(168,123,255,0.18);
      user-select:none;`;
    const title = document.createElement("span");
    title.textContent = t("logTitle");
    title.style.cssText = "color:#a87bff;font-weight:700;letter-spacing:.06em;white-space:nowrap;flex:none";
    this.badge = document.createElement("span");
    this.badge.textContent = "0";
    this.badge.style.cssText =
      "min-width:18px;text-align:center;padding:0 5px;border-radius:999px;background:rgba(168,123,255,0.25);color:#e8dcff";
    this.status = document.createElement("span");
    this.status.style.cssText = "margin-left:auto;color:#7d728f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0";
    const copyBtn = document.createElement("button");
    copyBtn.textContent = t("logCopy");
    copyBtn.style.cssText =
      "width:auto;display:inline-block;flex:none;margin:0 0 0 4px;padding:2px 8px;border-radius:6px;" +
      "cursor:pointer;font:inherit;white-space:nowrap;line-height:1.4;" +
      "background:rgba(168,123,255,0.18);border:1px solid rgba(168,123,255,0.35);color:#cfc2e6";
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = this.lines.join("\n");
      navigator.clipboard?.writeText(text).then(
        () => { copyBtn.textContent = t("logCopied"); setTimeout(() => (copyBtn.textContent = t("logCopy")), 1500); },
        () => { copyBtn.textContent = t("logCopy"); },
      );
    });

    const caret = document.createElement("span");
    caret.textContent = "▾";
    caret.style.cssText = "color:#7d728f";

    head.append(title, this.badge, this.status, copyBtn, caret);
    head.addEventListener("click", () => this.toggle());

    this.body = document.createElement("div");
    this.body.style.cssText = `
      display:none;max-height:34vh;overflow:auto;padding:6px 10px 8px;
      white-space:pre-wrap;word-break:break-all;`;
    this.root.append(head, this.body);
    document.body.appendChild(this.root);

    onLangChange(() => { title.textContent = t("logTitle"); copyBtn.textContent = t("logCopy"); });

    window.addEventListener("keydown", (e) => {
      if (e.key === "l" || e.key === "L") this.toggle();
    });

    this.hookGlobals();
  }

  private hookGlobals() {
    window.addEventListener("error", (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t !== (window as unknown as HTMLElement) && (t as HTMLImageElement).src) {
        this.log(`资源加载失败：${String((t as HTMLImageElement).src).split("/").pop()}`, "error");
        return;
      }
      this.log(`JS 错误：${e.message}`, "error");
    }, true);

    window.addEventListener("unhandledrejection", (e) => {
      const r = e.reason;
      this.log(`未捕获 Promise：${r instanceof Error ? r.message : String(r)}`, "error");
    });

    const origError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      this.log("console.error: " + args.map(String).join(" ").slice(0, 220), "error");
      origError(...args);
    };
  }

  log(msg: string, level: LogLevel = "info") {
    this.counts.total++;
    if (level === "error") this.counts.error++;
    this.badge.textContent = String(this.counts.total);

    const t = ((performance.now() - this.start) / 1000).toFixed(1).padStart(5, " ");
    const row = document.createElement("div");
    row.style.cssText = `color:${COLOR[level]};margin:1px 0`;
    row.textContent = `${t}s  ${msg}`;
    this.lines.push(`${t}s  ${msg}`);
    this.body.appendChild(row);
    while (this.body.childElementCount > 200) this.body.firstElementChild?.remove();
    this.body.scrollTop = this.body.scrollHeight;

    if (level === "error") {
      this.badge.style.background = "rgba(255,139,160,0.35)";
      if (!this.open) this.setOpen(true);
    }
  }

  /** 右上角一行状态（帧率、是否检测到手等） */
  setStatus(text: string) {
    this.status.textContent = text;
  }

  toggle() {
    this.setOpen(!this.open);
  }

  private setOpen(v: boolean) {
    this.open = v;
    this.body.style.display = v ? "block" : "none";
    this.body.scrollTop = this.body.scrollHeight;
  }

  /** 打印一次运行环境，诊断"动捕用不了"时最有用 */
  logEnv(extra: Record<string, string> = {}) {
    const gl = (() => {
      try {
        const c = document.createElement("canvas");
        const ctx = c.getContext("webgl2") || c.getContext("webgl");
        if (!ctx) return "no-webgl";
        const info = ctx.getExtension("WEBGL_debug_renderer_info");
        return info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "webgl";
      } catch {
        return "webgl-err";
      }
    })();

    this.log(L(`页面：${location.host}${location.pathname}`, `Page: ${location.host}${location.pathname}`), "info");
    this.log(
      L(
        `安全上下文：${window.isSecureContext ? "是（可开摄像头）" : "否（http 下摄像头不可用）"}`,
        `Secure context: ${window.isSecureContext ? "yes (camera allowed)" : "no (camera blocked on http)"}`,
      ),
      window.isSecureContext ? "ok" : "error",
    );
    const hasGum = typeof (navigator.mediaDevices ?? ({} as MediaDevices)).getUserMedia === "function";
    this.log(L(`摄像头 API：${hasGum ? "可用" : "不存在"}`, `Camera API: ${hasGum ? "available" : "missing"}`), hasGum ? "ok" : "error");
    this.log(`WebGL: ${gl}`, "info");
    this.log(`UA: ${navigator.userAgent.slice(0, 120)}`, "info");
    for (const [k, v] of Object.entries(extra)) this.log(`${k}: ${v}`, "info");
  }
}

export const logPanel = new LogPanel();
export const log = (msg: string, level: LogLevel = "info") => logPanel.log(msg, level);
