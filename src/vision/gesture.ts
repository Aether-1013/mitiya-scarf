/**
 * 21 点 → 手部姿态。
 * 判据全部走 MediaPipe 的 worldLandmarks（真实三维，米），所以手一旋转也不会误判。
 */
export type Pt = { x: number; y: number };
export type V3 = { x: number; y: number; z: number };

export type GestureName = "none" | "open" | "fist" | "scissors" | "point" | "pinch";

export type HandState = {
  present: boolean;
  palm: Pt;
  pinch: Pt;
  /** 0 = 张开，1 = 握拳 */
  curl: number;
  spread: number;
  roll: number;
  speed: number;
  gesture: GestureName;
  /** 屏幕空间骨架 */
  points: Pt[];
  /** 每根手指三段方向（手掌坐标系），顺序：拇指 食指 中指 无名指 小指 */
  fingerDirs: V3[][];
  /** 每根手指的蜷曲度 0..1 */
  fingerCurl: number[];
  /** 每根手指是否伸直（调试用） */
  ext: boolean[];
  /** 手掌坐标系三轴（世界坐标）：S 指向食指侧，U 指向上，N 为掌面法线 */
  basis: { s: V3; u: V3; n: V3 };
};

const EMPTY: HandState = {
  present: false,
  palm: { x: 0.5, y: 0.5 },
  pinch: { x: 0.5, y: 0.5 },
  curl: 0,
  spread: 1,
  roll: 0,
  speed: 0,
  gesture: "none",
  points: [],
  fingerDirs: [],
  fingerCurl: [0, 0, 0, 0, 0],
  ext: [false, false, false, false, false],
  basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const dist2 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1e-6;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/** 每根手指的四个关节点（掌指、近节、远节、指尖） */
const FINGER_PTS: [number, number, number, number][] = [
  [1, 2, 3, 4], // 拇指
  [5, 6, 7, 8], // 食指
  [9, 10, 11, 12], // 中指
  [13, 14, 15, 16], // 无名指
  [17, 18, 19, 20], // 小指
];

const GESTURE_WORDS: GestureName[] = ["none", "open", "fist", "scissors", "point", "pinch"];
const voteBuf: GestureName[] = [];

function vote(g: GestureName): GestureName {
  voteBuf.push(g);
  if (voteBuf.length > 5) voteBuf.shift();
  const count = new Map<GestureName, number>();
  for (const v of voteBuf) count.set(v, (count.get(v) ?? 0) + 1);
  let best: GestureName = "none";
  let n = -1;
  for (const [k, v] of count) if (v > n) {
    n = v;
    best = k;
  }
  return best;
}

export function lostHand(prev: HandState, dt: number): HandState {
  const k = Math.exp(-dt * 6);
  return { ...prev, present: false, speed: prev.speed * k, gesture: "none" };
}

export function analyze(
  screen: Pt[],
  world: V3[],
  dt: number,
  prev: HandState = EMPTY,
): HandState {
  if (screen.length < 21 || world.length < 21) return lostHand(prev, dt);

  // 手掌坐标系：up = 腕→中指根，side = 食指根→小指根
  const up = norm(sub(world[9], world[0]));
  let side = norm(sub(world[5], world[17])); // 小指 -> 食指
  const normal = norm(cross(up, side));
  side = norm(cross(normal, up));

  const palmSize = Math.hypot(...Object.values(sub(world[9], world[0]))) || 1e-6;

  const toLocal = (d: V3): V3 => ({ x: dot(d, side), y: dot(d, up), z: dot(d, normal) });

  // 每根手指：三段方向 + 蜷曲度
  const fingerDirs: V3[][] = [];
  const fingerCurl: number[] = [];
  const extended: boolean[] = [];

  FINGER_PTS.forEach(([mcp, pip, dip, tip], fi) => {
    const s1 = sub(world[pip], world[mcp]);
    const s2 = sub(world[dip], world[pip]);
    const s3 = sub(world[tip], world[dip]);

    fingerDirs.push([toLocal(norm(s1)), toLocal(norm(s2)), toLocal(norm(s3))]);

    // 伸直判据：掌指关节→指尖 的连线，相对于"手掌轴向 up"的夹角。
    // 这个量与手的整体朝向无关，比关节链角度稳得多。
    const dirMT = norm(sub(world[tip], world[mcp]));
    const ang = Math.acos(clamp(dot(dirMT, up), -1, 1));

    // 拇指天生外张，阈值放宽
    const thresh = fi === 0 ? 1.25 : 0.95;
    extended.push(ang < thresh);
    fingerCurl.push(clamp((ang - 0.35) / 1.15));
  });

  const thumbExtended = fingerCurl[0] < 0.45;
  const idx = fingerCurl[1];
  const mid = fingerCurl[2];
  const ring = fingerCurl[3];
  const pinky = fingerCurl[4];

  const curl = clamp((idx + mid + ring + pinky) / 4);

  // 捏合：拇指尖 ↔ 食指尖，按掌宽归一
  const pinchDist =
    Math.hypot(...Object.values(sub(world[4], world[8]))) / palmSize;

  // 剪刀：食指中指伸直，无名指小指蜷起，且两指张开
  const idxMidSep =
    Math.hypot(...Object.values(sub(world[8], world[12]))) / palmSize;

  let g: GestureName = "none";
  if (pinchDist < 0.35 && thumbExtended && idx > 0.35) g = "pinch";
  else if (extended[1] && extended[2] && !extended[3] && !extended[4]) g = "scissors";
  else if (!extended[1] && !extended[2] && !extended[3] && !extended[4]) g = "fist";
  else if (extended[1] && extended[2] && extended[3] && extended[4]) g = "open";
  else if (extended[1] && !extended[2] && !extended[3] && !extended[4]) g = "point";

  // 屏幕空间：掌心 / 捏合点 / 倾角 / 速度
  const palm: Pt = { x: 0, y: 0 };
  for (const i of [0, 5, 9, 13, 17]) {
    palm.x += screen[i].x / 5;
    palm.y += screen[i].y / 5;
  }
  const pinch = { x: (screen[4].x + screen[8].x) / 2, y: (screen[4].y + screen[8].y) / 2 };
  const roll = Math.atan2(screen[9].y - screen[0].y, screen[9].x - screen[0].x) + Math.PI / 2;

  const a = 1 - Math.exp(-dt * 20);
  const smoothPalm: Pt = prev.present
    ? { x: prev.palm.x + (palm.x - prev.palm.x) * a, y: prev.palm.y + (palm.y - prev.palm.y) * a }
    : palm;

  const rawSpeed = prev.present && dt > 0 ? dist2(palm, prev.palm) / dt : 0;

  // 手指方向做轻度平滑，避免抖
  const smoothedDirs: V3[][] = fingerDirs.map((segs, i) => {
    const prevSegs = prev.fingerDirs[i];
    if (!prev.present || !prevSegs || prevSegs.length !== 3) return segs;
    return segs.map((s, k) => ({
      x: prevSegs[k].x + (s.x - prevSegs[k].x) * a,
      y: prevSegs[k].y + (s.y - prevSegs[k].y) * a,
      z: prevSegs[k].z + (s.z - prevSegs[k].z) * a,
    }));
  });

  return {
    present: true,
    palm: smoothPalm,
    pinch,
    curl: prev.present ? prev.curl + (curl - prev.curl) * a : curl,
    spread: clamp(
      prev.present ? prev.spread + (1 - idxMidSep * 0.6 - prev.spread) * a : 1 - idxMidSep * 0.6,
    ),
    roll,
    speed: clamp(rawSpeed / 1.6),
    gesture: vote(g),
    points: screen,
    fingerDirs: smoothedDirs,
    fingerCurl,
    ext: extended,
    basis: { s: side, u: up, n: normal },
  };
}

export { EMPTY as emptyHand, GESTURE_WORDS };
