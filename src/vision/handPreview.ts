import type { HandState } from "./gesture";

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const TIPS = [4, 8, 12, 16, 20];

const TINT: Record<string, string> = {
  open: "#7ef0d0",
  fist: "#ffb86b",
  pinch: "#ff8bd0",
  scissors: "#a87bff",
  point: "#8ec7ff",
  none: "#6f6390",
};

export function drawHandPreview(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | HTMLImageElement,
  hand: HandState,
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);

  // 背景：镜像的摄像头画面（照片模式则直接是照片）
  const vw = (video as HTMLVideoElement).videoWidth || (video as HTMLImageElement).naturalWidth;
  const vh = (video as HTMLVideoElement).videoHeight || (video as HTMLImageElement).naturalHeight;
  let box: { ox: number; oy: number; dw: number; dh: number } | null = null;

  if (vw && vh) {
    const s = Math.max(w / vw, h / vh);
    const dw = vw * s;
    const dh = vh * s;
    box = { ox: (w - dw) / 2, oy: (h - dh) / 2, dw, dh };
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, box.ox, box.oy, dw, dh);
    ctx.restore();
    ctx.fillStyle = "rgba(8, 5, 18, 0.42)";
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = "#0b0715";
    ctx.fillRect(0, 0, w, h);
  }

  const toXY = (x: number, y: number) => {
    if (!box) return { x: x * w, y: y * h };
    return { x: box.ox + x * box.dw, y: box.oy + y * box.dh };
  };

  const pts = hand.points;
  const tint = TINT[hand.gesture] ?? TINT.none;
  const dim = hand.present ? 1 : 0.35;
  const scale = w / 240;

  if (pts.length >= 21) {
    ctx.save();
    ctx.globalAlpha = dim;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 骨架：外发光 + 实线
    ctx.shadowColor = tint;
    ctx.shadowBlur = 8 * scale;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    for (const [a, b] of BONES) {
      const p1 = toXY(pts[a].x, pts[a].y);
      const p2 = toXY(pts[b].x, pts[b].y);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 关节点
    for (let i = 0; i < 21; i++) {
      const p = toXY(pts[i].x, pts[i].y);
      const isTip = TIPS.includes(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (isTip ? 3.4 : 2.2) * scale, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? "#ffffff" : tint;
      ctx.fill();
    }

    // 掌心十字
    const palm = toXY(hand.palm.x, hand.palm.y);
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(palm.x - 5 * scale, palm.y);
    ctx.lineTo(palm.x + 5 * scale, palm.y);
    ctx.moveTo(palm.x, palm.y - 5 * scale);
    ctx.lineTo(palm.x, palm.y + 5 * scale);
    ctx.stroke();

    // 捏合时连一条线
    if (hand.gesture === "pinch") {
      const a = toXY(pts[4].x, pts[4].y);
      const b = toXY(pts[8].x, pts[8].y);
      ctx.strokeStyle = "#ff8bd0";
      ctx.lineWidth = 1.6 * scale;
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 没检测到手时给一句话
  if (!hand.present) {
    ctx.save();
    ctx.fillStyle = "rgba(230,220,255,0.75)";
    ctx.font = `${11 * scale}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("未检测到手", w / 2, h / 2);
    ctx.restore();
  }

  // 四角取景框
  const c = 10 * scale;
  const m = 6 * scale;
  ctx.strokeStyle = `rgba(168,123,255,${hand.present ? 0.55 : 0.2})`;
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
    const x = sx ? w - m : m;
    const y = sy ? h - m : m;
    ctx.moveTo(x + (sx ? -c : c), y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + (sy ? -c : c));
  }
  ctx.stroke();
}
