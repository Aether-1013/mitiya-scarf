import * as THREE from "three";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";
import { HandTracker } from "./vision/hand";
import { analyze, emptyHand, lostHand, type HandState } from "./vision/gesture";
import { drawHandPreview } from "./vision/handPreview";
import { RpsGame, RPS_CN, type RPS } from "./game/rps";
import { POSES } from "./game/poses";
import { log, logPanel } from "./ui/logPanel";
import { t, L, setLang, lang, onLangChange, initI18n } from "./ui/i18n";
initI18n();

const canvas = document.getElementById("stage3d") as HTMLCanvasElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const gate = document.getElementById("gate") as HTMLDivElement;
const loadBar = document.getElementById("loadbar") as HTMLElement | null;
const loadPct = document.getElementById("loadpct") as HTMLElement | null;
const loadMsgEl = document.getElementById("loadmsg") as HTMLElement | null;

/**
 * 加载遮罩上的进度条故意做成"时间驱动"的假进度：
 * 首屏要下 25 MB 左右，慢网下真实进度会长时间卡在个位数，看起来像卡死。
 * 这里把条按预估时长推到 99%，真正就绪时再瞬间补满。
 */
let barRaf = 0;
let barDone = false;
let barStart = performance.now();
let barDuration = 70_000;

function paintBar(pct: number) {
  const v = Math.max(0, Math.min(100, pct));
  if (loadBar) loadBar.style.width = v.toFixed(1) + "%";
  if (loadPct) loadPct.textContent = Math.round(v) + "%";
}

function startBar(durationMs: number) {
  barDone = false;
  barStart = performance.now();
  barDuration = durationMs;
  if (barRaf) cancelAnimationFrame(barRaf);
  const tick = () => {
    if (barDone) return;
    const t = (performance.now() - barStart) / barDuration;
    // 前段快、后段慢（ease-out），到 99% 停住等真实就绪
    const pct = Math.min(99, 99 * (1 - Math.pow(1 - Math.min(t, 1), 2.2)));
    paintBar(pct);
    barRaf = requestAnimationFrame(tick);
  };
  barRaf = requestAnimationFrame(tick);
}

/** 真实阶段只更新下方文字（这时条由假进度控制） */
function setProgress(_pct: number, text?: string) {
  if (text && loadMsgEl) loadMsgEl.textContent = text;
}

function finishBar() {
  barDone = true;
  if (barRaf) cancelAnimationFrame(barRaf);
  paintBar(100);
}

// ---- 遮罩的三个可替换文案 ----
const gateKickerEl = gate.querySelector(".gate-kicker") as HTMLElement | null;
const gateTitleEl = gate.querySelector("h2") as HTMLElement | null;
const gateHintEl = gate.querySelector(".gate-hint") as HTMLElement | null;

function showGate(kicker: string, title: string, hint: string, durationMs: number) {
  if (gateKickerEl) gateKickerEl.textContent = kicker;
  if (gateTitleEl) gateTitleEl.textContent = title;
  if (gateHintEl) gateHintEl.textContent = hint;
  if (loadMsgEl) loadMsgEl.textContent = t("gatePreparing");
  gate.classList.remove("hide");
  startBar(durationMs);
}

function hideGate(delay = 220) {
  finishBar();
  window.setTimeout(() => gate.classList.add("hide"), delay);
}

startBar(70_000);

const params = new URLSearchParams(location.search);
const KEEP = (params.get("keep") ?? "Ribbon Hand").split(",").map((s) => s.trim());

/** 手感参数：?tune=1 可以直接拖 */
const tune = {
  droop: 1.0, // 下垂强度倍率（1 = 按真实弧长解）
  anchorY: -0.9, // 根部锚点的世界高度
  aimLag: 8, // 末端跟随手的速度
  sway: 0.05, // 静止时的自然飘动
  fingerAmt: 1.9, // 须子最大弯曲角（弧度）：猜拳要能真的握成拳
  maxJoint: Number(params.get("maxJoint") ?? 1.9), // 单个关节最大弯曲（弧度）
  deadZone: 0.18, // 与静止方向夹角小于此值就不动（消除静止时的反向抖动）
  twist: 0.65, // 扭转跟随手掌法线的强度
  fingerOmega: 26, // 须子刚度
  fingerLag: 20, // 须子跟随速度
  palmAmt: 0.3, // 手指弯曲时，手掌跟着弯多少
  splay: 0.32, // 伸直时向外扇开的角度（弧度/根）
  shapeLag: 2.2, // 猜拳形态之间过渡的平滑速度（越小越慢）
  poseLag: 2.2, // 回放姿态之间的过渡速度（越小越慢、越丝滑）
  idleCurl: 0.3, // 待机时须子的放松蜷曲度
  viewR: 17.5, // 只看围巾上半段
  viewTy: 8.0,
};

/**
 * 四根须子 ← 手指数：0=拇指 1=食指 2=中指 3=无名指 4=小指
 * 默认 [拇指, 食指, 中指, 无名指]，小指不参与（对应模型 A/B/C/D 四根须子）
 * 可用 ?map=1,2,3,4 之类覆盖
 */
const fingerMap = (params.get("map") ?? "0,1,2,3").split(",").map((s) => Number(s.trim()) % 5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x05030c, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 400);

const view = { az: 0.0, el: 0.03, r: tune.viewR, ty: tune.viewTy, tx: 0 };
function updateCamera() {
  const { az, el, r, ty, tx } = view;
  camera.position.set(tx + Math.sin(az) * Math.cos(el) * r, ty + Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
  camera.lookAt(tx, ty, 0);
}
updateCamera();

scene.add(new THREE.HemisphereLight(0xe6ecff, 0x2a1b46, 2.3));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(5, 14, 12);
scene.add(key);
const fill = new THREE.DirectionalLight(0xa87bff, 1.6);
fill.position.set(-9, 6, 8);
scene.add(fill);
const rim = new THREE.DirectionalLight(0x8ef0d8, 1.3);
rim.position.set(0, 2, -12);
scene.add(rim);

scene.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(80, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x0d0819, side: THREE.BackSide }),
  ),
);

// 调试：IK 目标点
const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xff5ea8 }),
);
marker.visible = params.has("marker");
scene.add(marker);

// ---------------- 目标点 ----------------
const targetNdc = new THREE.Vector2(0.2, 0.35);
const targetWorld = new THREE.Vector3();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -3);
const raycaster = new THREE.Raycaster();

if (params.has("t")) {
  const [x, y] = params.get("t")!.split(",").map(Number);
  targetNdc.set(x, y);
}

let useCamera = false;

canvas.addEventListener("pointermove", (e) => {
  if (useCamera) return;
  const r = canvas.getBoundingClientRect();
  targetNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
});

// ---------------- 手部动捕 ----------------
const video = document.getElementById("cam") as HTMLVideoElement;
let tracker: HandTracker | null = null;
let hand: HandState = emptyHand;
let gestureCurl = 0;
let fingerTargets: number[] = [0, 0, 0, 0, 0];

const hpWrap = document.getElementById("handPreviewWrap") as HTMLDivElement;
const hpCanvas = document.getElementById("handPreview") as HTMLCanvasElement;
const hpCtx = hpCanvas.getContext("2d")!;
const hpName = document.getElementById("hpName") as HTMLElement;
const hpCurl = document.getElementById("hpCurl") as HTMLElement;
const hpSpread = document.getElementById("hpSpread") as HTMLElement;
const hpDpr = Math.min(2, window.devicePixelRatio || 1);

const GESTURE_CN: Record<string, string> = {
  open: "张开",
  fist: "握拳",
  pinch: "捏合",
  scissors: "剪刀",
  point: "指向",
  none: "—",
};

function sizeHandPreview() {
  const r = hpCanvas.getBoundingClientRect();
  if (!r.width) return;
  hpCanvas.width = Math.round(r.width * hpDpr);
  hpCanvas.height = Math.round(r.height * hpDpr);
}

function drawPreview() {
  if (!hpCanvas.width) sizeHandPreview();
  const w = hpCanvas.width / hpDpr;
  const h = hpCanvas.height / hpDpr;
  hpCtx.setTransform(hpDpr, 0, 0, hpDpr, 0, 0);
  drawHandPreview(hpCtx, stillImage ?? video, hand, w, h);
  hpName.textContent = GESTURE_CN[hand.gesture] ?? "—";
  hpCurl.textContent = `curl ${Math.round(hand.curl * 100)}%`;
  hpSpread.textContent = `spread ${Math.round(hand.spread * 100)}%`;
}

// ---------------- 照片模式：用参考照片当输入 ----------------
let stillImage: HTMLImageElement | null = null;

async function bootImage(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  stillImage = img;
  tracker = new HandTracker();
  await tracker.init((m) => (statusEl.textContent = m), "IMAGE");
  useCamera = true;
  statusEl.textContent = `照片模式 ${img.naturalWidth}x${img.naturalHeight}`;
  hpWrap.classList.add("on");
  sizeHandPreview();
  document.body.dataset.imgReady = "1";
}

if (params.has("img")) void bootImage(params.get("img")!);

/** 五根手指的蜷曲度（0 伸直，1 蜷起），顺序：拇指 食指 中指 无名指 小指 */
function fingerCurlsFromPoints(p: { x: number; y: number }[]): number[] | null {
  if (p.length < 21) return null;
  const chains: [number, number, number][] = [
    [2, 3, 4], // 拇指
    [5, 6, 8], // 食指
    [9, 10, 12], // 中指
    [13, 14, 16], // 无名指
    [17, 18, 20], // 小指
  ];
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
  return chains.map(([m, pi, t]) => {
    const arc = dist(p[m], p[pi]) + dist(p[pi], p[t]) + 1e-6;
    return THREE.MathUtils.clamp((1 - dist(p[m], p[t]) / arc) / 0.4, 0, 1);
  });
}

const camBtn = document.getElementById("startCam") as HTMLButtonElement | null;

async function bootCamera() {
  if (camBtn) {
    camBtn.disabled = true;
    camBtn.textContent = t("btnCamStarting");
  }
  showGate(
    "HAND TRACKING",
    t("gateTracking"),
    t("gateTrackingHint"),
    30000,
  );
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      log(L("这个浏览器没有 getUserMedia（常见：非 HTTPS、或微信/QQ 内置浏览器）", "This browser has no getUserMedia (usually: not HTTPS, or an in-app browser)"), "error");
    }
    log(L("请求摄像头权限…", "Requesting camera permission…"));
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    await video.play();
    log(L(`摄像头就绪 ${video.videoWidth}x${video.videoHeight}`, `Camera ready ${video.videoWidth}x${video.videoHeight}`), "ok");

    tracker = new HandTracker();
    await tracker.init((m) => {
      statusEl.textContent = m;
      log(m);
      setProgress(0, m);
    });
    useCamera = true;
    statusEl.textContent = t("statusTracking");
    if (camBtn) camBtn.textContent = t("btnCamDone");
    hpWrap.classList.add("on");
    sizeHandPreview();
    log(L(`推理引擎就绪（${tracker.delegate}），开始追踪`, `Engine ready (${tracker.delegate}), tracking`), "ok");
    setProgress(0, `就绪（${tracker.delegate}）`);
    hideGate(400);
  } catch (e) {
    const err = e as { name?: string; message?: string };
    const hint =
      err.name === "NotAllowedError"
        ? "权限被拒绝——点地址栏的摄像头图标重新允许"
        : err.name === "NotFoundError"
          ? "没有找到摄像头设备"
          : err.name === "NotReadableError"
            ? "摄像头被其它程序占用（相机 App / 会议软件）"
            : err.name === "OverconstrainedError"
              ? "摄像头不支持 1280x720，试试换设备"
              : "未知错误";
    log(`摄像头失败：${err.name ?? "Error"} ${err.message ?? ""}`, "error");
    log(`建议：${hint}`, "warn");
    if (gateHintEl) gateHintEl.textContent = `摄像头启动失败：${hint}`;
    setProgress(0, err.name ?? "错误");
    window.setTimeout(() => hideGate(0), 4000);
    statusEl.textContent = `摄像头不可用：${err.message ?? err.name ?? e}`;
    if (camBtn) {
      camBtn.disabled = false;
      camBtn.textContent = t("btnCamRetry");
    }
  }
}
camBtn?.addEventListener("click", bootCamera);

// ---------------- 骨骼结构 ----------------
type Chain = {
  bones: THREE.Bone[];
  restQ: THREE.Quaternion[];
  offsets: THREE.Vector3[];
  segLen: number[];
  rootParentQ: THREE.Quaternion;
  rootParentP: THREE.Vector3;
  root: THREE.Vector3;
  length: number;
};

type Finger = {
  bones: THREE.Bone[];
  restQ: THREE.Quaternion[];
  parentQ: THREE.Quaternion[];
  axis: THREE.Vector3;
  ang: number[];
  vel: number[];
  phase: number;
  /** 三段的静止方向（父骨坐标系下） */
  restDir: THREE.Vector3[];
  /** 父骨在 backbone 里的下标（A 挂 SplineIK06，B/C/D 挂 HandA01） */
  parentIdx: number;
  /** 相对手掌中心在左(-1)还是右(+1)，用于张开时向外扇 */
  side: number;
};

let chain: Chain | null = null;
let fingers: Finger[] = [];
let fingerState: number[] = [];
let fingerErr: number[][] = [];

// ---------- 骨骼可视化 ----------
const boneVis = new THREE.Group();
boneVis.visible = params.has("bones");
scene.add(boneVis);
const FINGER_COLORS = [0xff5ea8, 0xffb86b, 0x7ef0d0, 0x8ec7ff];

/** 把一段骨骼画成圆柱 + 两端关节球 */
type Seg = { mesh: THREE.Mesh; a: () => THREE.Vector3; b: () => THREE.Vector3 };
const segs: Seg[] = [];
const jointMeshes: THREE.Mesh[] = [];
const UP_Y = new THREE.Vector3(0, 1, 0);
/** 手掌坐标系 (S,U,N) -> HandA01 局部轴 */
const modelBasis = new THREE.Matrix4();
const modelBasisInv = new THREE.Matrix4();
const U_AXIS = new THREE.Vector3(0, 1, 0);

function addJoint(pos: () => THREE.Vector3, color: number, r = 0.1) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 10, 8),
    new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 }),
  );
  m.renderOrder = 21;
  boneVis.add(m);
  jointMeshes.push(m);
  const upd = () => {
    m.position.copy(pos());
  };
  upd();
  (m as THREE.Mesh & { __upd?: () => void }).__upd = upd;
}

function addSeg(a: () => THREE.Vector3, b: () => THREE.Vector3, color: number) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1, 8),
    new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 }),
  );
  mesh.renderOrder = 20;
  boneVis.add(mesh);
  segs.push({ mesh, a, b });
}

function buildBoneVis() {
  if (!chain) return;
  const bp = (i: number) => () => chain!.bones[i].getWorldPosition(new THREE.Vector3());

  for (let i = 0; i < chain.bones.length; i++) addJoint(bp(i), 0x66ffd0, i === 0 ? 0.16 : 0.1);
  for (let i = 0; i + 1 < chain.bones.length; i++) addSeg(bp(i), bp(i + 1), 0x3ad6a8);

  fingers.forEach((f, fi) => {
    const color = FINGER_COLORS[fi % 4];
    const fp = (i: number) => () => f.bones[i].getWorldPosition(new THREE.Vector3());
    for (let i = 0; i < f.bones.length; i++) addJoint(fp(i), color, 0.09);
    addSeg(bp(chain!.bones.length - 1), fp(0), color);
    addSeg(fp(0), fp(1), color);
    addSeg(fp(1), fp(2), color);
    // 末节再往前延伸一点，表示指尖方向
    addSeg(fp(2), () => {
      const p = f.bones[2].getWorldPosition(new THREE.Vector3());
      const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(f.bones[2].getWorldQuaternion(new THREE.Quaternion()));
      return p.add(dir.multiplyScalar(0.7));
    }, color);
  });

  boneVis.visible = params.has("bones");
}

function updateBoneVis() {
  if (!boneVis.visible) return;
  for (const m of jointMeshes) (m as THREE.Mesh & { __upd?: () => void }).__upd?.();
  for (const s of segs) {
    const a = s.a();
    const b = s.b();
    const dir = b.clone().sub(a);
    const len = dir.length() || 1e-4;
    s.mesh.position.copy(a).add(dir.multiplyScalar(0.5));
    s.mesh.quaternion.setFromUnitVectors(UP_Y, dir.normalize());
    s.mesh.scale.set(1, len, 1);
  }
}
let holderRef: THREE.Group | null = null;
let meshRef: THREE.SkinnedMesh | null = null;
let rootBoneRef: THREE.Bone | null = null;

/** 移动锚点后重新缓存根部父节点的世界变换（IK 的参考系） */
function refreshRootFrame() {
  if (!chain || !rootBoneRef) return;
  meshRef?.updateMatrixWorld(true);
  if (rootBoneRef.parent) {
    const m = new THREE.Matrix4();
    m.extractRotation(rootBoneRef.parent.matrixWorld);
    chain.rootParentQ.setFromRotationMatrix(m);
    chain.rootParentP.setFromMatrixPosition(rootBoneRef.parent.matrixWorld);
  }
  chain.root.copy(rootBoneRef.getWorldPosition(new THREE.Vector3()));
}

function setAnchor(y: number) {
  if (!holderRef || !rootBoneRef) return;
  const cur = rootBoneRef.getWorldPosition(new THREE.Vector3()).y;
  holderRef.position.y += y - cur;
  refreshRootFrame();
}

function keepGroups(geo: THREE.BufferGeometry, materials: THREE.Material[], keepNames: string[]) {
  const arr = geo.index!.array as unknown as Uint32Array;
  const buckets = new Map<number, number[]>();
  const kept: THREE.Material[] = [];

  for (const g of geo.groups) {
    const mat = g.materialIndex !== undefined ? materials[g.materialIndex] : undefined;
    if (!mat || !keepNames.includes(mat.name)) continue;
    let mi = kept.indexOf(mat);
    if (mi < 0) {
      mi = kept.length;
      kept.push(mat);
    }
    const bucket = buckets.get(mi) ?? [];
    for (let i = 0; i < g.count; i++) bucket.push(arr[g.start + i]);
    buckets.set(mi, bucket);
  }

  const flat: number[] = [];
  const groups: { start: number; count: number; mi: number }[] = [];
  for (const [mi, bucket] of buckets) {
    groups.push({ start: flat.length, count: bucket.length, mi });
    for (const v of bucket) flat.push(v);
  }
  return { indices: new Uint32Array(flat), groups, materials: kept, total: flat.length };
}

THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
  // 模型本身也走这个 manager，所以贴图阶段用"占总数的比例"接在 70% 之后
  setProgress(70 + (loaded / Math.max(1, total)) * 30, `贴图 ${loaded}/${total}`);
  if (loaded === total) log(L(`资源就绪 ${total}/${total}`, `Assets ready ${total}/${total}`), "ok");
  else if (loaded % 5 === 0) log(L(`资源 ${loaded}/${total}`, `Assets ${loaded}/${total}`));
};
THREE.DefaultLoadingManager.onError = (url) => {
  log(`资源 404：${url.split("/").slice(-2).join("/")}`, "error");
};

logPanel.logEnv({ [lang() === "zh" ? "构建" : "Build"]: "pages/" + (location.host.includes("pages.dev") ? "cloudflare" : "local") });
log(L("开始加载模型 MItya.pmx（3.7 MB）", "Loading MItya.pmx (3.7 MB)"));
const loader = new MMDLoader();
loader.load("/models/mitiya/MItya.pmx", (data) => {
  log(L("模型解析完成", "Model parsed"), "ok");
  const mesh = data as unknown as THREE.SkinnedMesh;
  const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[];
  const { indices, groups, materials: used, total } = keepGroups(mesh.geometry, materials, KEEP);

  const geo = mesh.geometry.clone();
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.clearGroups();
  for (const g of groups) geo.addGroup(g.start, g.count, g.mi);
  for (const m of used) m.side = THREE.DoubleSide;

  mesh.geometry = geo;
  mesh.material = used;
  mesh.frustumCulled = false;

  // 翻转 180°：根部在下、飘带朝上
  const holder = new THREE.Group();
  holderRef = holder;
  meshRef = mesh;
  holder.rotation.x = Math.PI;
  holder.add(mesh);
  scene.add(holder);

  mesh.updateMatrixWorld(true);
  const rootBone = mesh.skeleton.bones.find((b) => b.name === "Bone_ShawlE01_L");
  rootBoneRef = rootBone ?? null;
  if (!rootBone) throw new Error("找不到围巾根骨骼");

  const rootPos0 = rootBone.getWorldPosition(new THREE.Vector3());
  holder.position.y = -rootPos0.y - 0.9;
  mesh.updateMatrixWorld(true);

  // 权重统计
  const si = geo.attributes.skinIndex as THREE.BufferAttribute;
  const sw = geo.attributes.skinWeight as THREE.BufferAttribute;
  const votes = new Map<number, number>();
  for (let i = 0; i < total; i++) {
    const vi = indices[i];
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(vi, k);
      if (w > 0.02) votes.set(si.getComponent(vi, k), (votes.get(si.getComponent(vi, k)) ?? 0) + w);
    }
  }

  const bones = mesh.skeleton.bones;
  const hasWeight = (b: THREE.Object3D) => (votes.get(bones.indexOf(b as THREE.Bone)) ?? 0) > 0.05;

  // 主干：权重最长的父子链
  let best: THREE.Bone[] = [];
  let bestLen = 0;
  const walk = (b: THREE.Bone, path: THREE.Bone[], len: number) => {
    const next = [...path, b];
    const kids = b.children.filter((c) => (c as THREE.Bone).isBone && hasWeight(c)) as THREE.Bone[];
    if (!kids.length) {
      if (len > bestLen) {
        bestLen = len;
        best = next;
      }
      return;
    }
    for (const k of kids) walk(k, next, len + k.position.length());
  };
  walk(rootBone, [], 0);

  const backbone = best.filter((b) => !/^Bone_Finger/.test(b.name));

  const restQ: THREE.Quaternion[] = [];
  const offsets: THREE.Vector3[] = [];
  const segLen: number[] = [];
  for (const b of backbone) {
    restQ.push(b.quaternion.clone());
    offsets.push(b.position.clone());
    segLen.push(b.position.length());
  }

  const rootParentQ = new THREE.Quaternion();
  const rootParentP = new THREE.Vector3();
  if (backbone[0].parent) {
    backbone[0].parent.updateWorldMatrix(true, false);
    const m = new THREE.Matrix4();
    m.extractRotation(backbone[0].parent.matrixWorld);
    rootParentQ.setFromRotationMatrix(m);
    rootParentP.setFromMatrixPosition(backbone[0].parent.matrixWorld);
  }

  let length = 0;
  for (let i = 1; i < segLen.length; i++) length += segLen[i];

  chain = {
    bones: backbone,
    restQ,
    offsets,
    segLen,
    rootParentQ,
    rootParentP,
    root: backbone[0].getWorldPosition(new THREE.Vector3()),
    length,
  };

  // 四条须子
  const byKey = new Map<string, THREE.Bone[]>();
  for (const b of bones) {
    const m = /^Bone_Finger([ABCD])0([123])_([LR])$/.exec(b.name);
    if (!m) continue;
    const arr = byKey.get(m[1]) ?? [];
    arr[Number(m[2]) - 1] = b;
    byKey.set(m[1], arr);
  }

  fingers = [];
  fingerState = [];
  for (const k of ["A", "B", "C", "D"]) {
    const arr = byKey.get(k);
    if (!arr || arr.length < 3 || arr.some((x) => !x)) continue;
    const rq: THREE.Quaternion[] = [];
    const pq: THREE.Quaternion[] = [];
    for (const b of arr) {
      rq.push(b.quaternion.clone());
      const m = new THREE.Matrix4();
      if (b.parent) {
        b.parent.updateWorldMatrix(true, false);
        m.extractRotation(b.parent.matrixWorld);
        pq.push(new THREE.Quaternion().setFromRotationMatrix(m));
      } else pq.push(new THREE.Quaternion());
    }
    const p0 = arr[0].getWorldPosition(new THREE.Vector3());
    const p2 = arr[2].getWorldPosition(new THREE.Vector3());
    const dir = p2.clone().sub(p0).normalize();
    fingers.push({
      bones: arr,
      restQ: rq,
      parentQ: pq,
      axis: new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1)).normalize(),
      ang: [0, 0, 0],
      vel: [0, 0, 0],
      phase: fingers.length * 1.7,
      restDir: [
        arr[1].position.clone().normalize(),
        arr[2].position.clone().normalize(),
        new THREE.Vector3(0, 1, 0),
      ],
      parentIdx: backbone.indexOf(arr[0].parent as THREE.Bone),
      side: Math.sign(arr[0].position.x) || 1,
    });
    fingerState.push(0);
  }

  // 剔除不属于主飘带的面（手部饰带、旁支飘带）
  const allowed = /^(Bone_ShawlE01_L|Bone_RibbonSplineIK0[1-6]_L|Bone_HandA01_L|Bone_Finger[ABCD]0[123]_[LR])$/;
  const nameOf = (i: number) => bones[i]?.name ?? "";
  const tris: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    let good = 0;
    for (let k = 0; k < 3; k++) {
      const vi = indices[t + k];
      let w = 0;
      for (let j = 0; j < 4; j++) {
        if (allowed.test(nameOf(si.getComponent(vi, j)))) w += sw.getComponent(vi, j);
      }
      if (w > 0.5) good++;
    }
    if (good === 3) tris.push(indices[t], indices[t + 1], indices[t + 2]);
  }
  if (tris.length) {
    const arr2 = new Uint32Array(tris);
    geo.setIndex(new THREE.BufferAttribute(arr2, 1));
    geo.clearGroups();
    geo.addGroup(0, arr2.length, 0);
    mesh.geometry = geo;
  }

  statusEl.textContent =
    lang() === "zh"
      ? `${(tris.length || indices.length) / 3} 面 · ${backbone.length} 骨`
      : `${(tris.length || indices.length) / 3} tris · ${backbone.length} bones`;

  // 贴图是异步的：等第一张贴图解码完成再收起遮罩，否则会看到空场景
  let waited = 0;
  const showWhenTextured = () => {
    waited += 150;
    const texReady = used.some((m) => !!(m as { map?: { image?: unknown } }).map?.image);
    if (texReady || waited > 15000) {
      buildBoneVis();
      if (boneVis.visible) {
        for (const m of used) {
          m.transparent = true;
          m.opacity = 0.3;
          m.depthWrite = false;
        }
      }
      setProgress(0, t("statusReady"));
      hideGate(0);
      document.body.dataset.ready = "1";
    } else {
      setTimeout(showWhenTextured, 150);
    }
  };
  showWhenTextured();
  void 0;

  buildBoneVis();

  // 模型手掌基座：把手掌坐标系的 (S,U,N) 映射到 HandA01 的局部轴
  {
    const handBone = backbone[backbone.length - 1];
    handBone.updateWorldMatrix(true, false);
    const qhInv = handBone.getWorldQuaternion(new THREE.Quaternion()).invert();

    const rootA = fingers[0]?.bones[0].getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
    const rootD = fingers[3]?.bones[0].getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3(1, 0, 0);
    const flipS = params.has("flipS") ? -1 : 1;
    const flipU = params.has("flipU") ? -1 : 1;
    const Sw = rootA.clone().sub(rootD).normalize().multiplyScalar(flipS);

    const Uw = new THREE.Vector3();
    for (const f of fingers) {
      const a = f.bones[0].getWorldPosition(new THREE.Vector3());
      const b = f.bones[1].getWorldPosition(new THREE.Vector3());
      Uw.add(b.clone().sub(a).normalize());
    }
    if (Uw.lengthSq() < 1e-6) Uw.set(0, 1, 0);
    Uw.normalize().multiplyScalar(flipU);
    const Nw = new THREE.Vector3().crossVectors(Uw, Sw).normalize();

    modelBasis.makeBasis(
      Sw.clone().applyQuaternion(qhInv).normalize(),
      Uw.clone().applyQuaternion(qhInv).normalize(),
      Nw.clone().applyQuaternion(qhInv).normalize(),
    );
    modelBasisInv.copy(modelBasis).invert();
    console.log("BASIS", JSON.stringify({ s: Sw.toArray(), u: Uw.toArray(), fingers: fingers.length }));
  }

  if (boneVis.visible) {
    for (const m of used) {
      m.transparent = true;
      m.opacity = 0.3;
      m.depthWrite = false;
    }
  }
  (window as unknown as { __scarf: unknown }).__scarf = {
    hand: () => ({ g: hand.gesture, curls: hand.fingerCurl.map((v) => +v.toFixed(2)), ext: hand.ext, present: hand.present }),
    fingerDirs: () => hand.fingerDirs.map((segs) => segs.map((v) => [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)])),
    chain,
    fingers,
    fingerErr: () => fingerErr.map((e) => +(e.reduce((a,b)=>a+b,0)/Math.max(1,e.length)).toFixed(1)),
    probe: () => ({
      err: +tipErr.toFixed(4),
      len: +chain!.length.toFixed(2),
      chord: +chain!.root.distanceTo(goal).toFixed(2),
      droop: +lastDroop.toFixed(2),
      tip: chain!.bones[chain!.bones.length - 1].getWorldPosition(new THREE.Vector3()).toArray(),
      goal: goal.toArray(),
    }),
  };
},
  // 下载进度：模型占 0–70%，贴图占 70–100%
  (xhr: { loaded: number; total: number }) => {
    if (!xhr.total) {
      setProgress(0, `模型下载中 ${(xhr.loaded / 1048576).toFixed(1)} MB`);
      return;
    }
    setProgress(
      0,
      `模型 ${(xhr.loaded / 1048576).toFixed(1)} / ${(xhr.total / 1048576).toFixed(1)} MB`,
    );
  },
  (err: unknown) => {
    log(`模型加载失败：${String(err)}`, "error");
    setProgress(0, t("gateFailed"));
  },
);

// ---------------- 求解 ----------------
const smoothTip = new THREE.Vector3();
const QID = new THREE.Quaternion();
let tipInited = false;
let tipErr = 0;
let lastDroop = 0;
const goal = new THREE.Vector3();
const wp: THREE.Vector3[] = [];
const wq: THREE.Quaternion[] = [];
const DOWN = new THREE.Vector3(0, -1, 0);
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const qAlign = new THREE.Quaternion();

/**
 * 两端固定的悬垂：
 *   P0（根部，钉死）—— 抛物线垂度 —— P1（手，钉死）
 * 用二分求垂度，使曲线弧长正好等于围巾总长，再按弧长排关节。
 */
function solveDroop(P0: THREE.Vector3, P1: THREE.Vector3, L: number, segLen: number[], n: number) {
  const dirC = tmp.copy(P1).sub(P0);
  const cLen = dirC.length() || 1e-6;
  dirC.normalize();

  // 累计弧长
  const cum: number[] = new Array(n).fill(0);
  let acc = 0;
  for (let i = 1; i < n; i++) {
    acc += segLen[i];
    cum[i] = acc;
  }

  const sampleAt = (h: number, t: number, out: THREE.Vector3) =>
    out
      .copy(P0)
      .addScaledVector(dirC, cLen * t)
      .addScaledVector(DOWN, h * 4 * t * (1 - t));

  const arcOf = (h: number) => {
    let sum = 0;
    let prev = sampleAt(h, 0, tmp2).clone();
    for (let k = 1; k <= 40; k++) {
      const cur = sampleAt(h, k / 40, tmp2).clone();
      sum += cur.distanceTo(prev);
      prev = cur;
    }
    return sum;
  };

  // 弦长已超过总长 → 没有余量，只能拉直
  let droop = 0;
  if (cLen < L * 0.998) {
    let lo = 0;
    let hi = L * 1.5;
    for (let k = 0; k < 24; k++) {
      const h = (lo + hi) / 2;
      if (arcOf(h) < L) lo = h;
      else hi = h;
    }
    droop = ((lo + hi) / 2) * tune.droop;
  }
  lastDroop = droop;

  // 按弧长取点
  const N = 200;
  const pts: THREE.Vector3[] = [];
  const cumS: number[] = [0];
  for (let k = 0; k <= N; k++) {
    pts.push(sampleAt(droop, k / N, new THREE.Vector3()));
    if (k > 0) cumS.push(cumS[k - 1] + pts[k].distanceTo(pts[k - 1]));
  }
  const totalS = cumS[N] || 1;

  let cursor = 0;
  for (let i = 0; i < n; i++) {
    const want = (cum[i] / (L || 1)) * totalS;
    while (cursor < N && cumS[cursor] < want) cursor++;
    wp[i].copy(pts[cursor]);
  }
  wp[0].copy(P0);
  wp[n - 1].copy(P1);
}

function drive(
  target: THREE.Vector3,
  time: number,
  curl: number,
  fTargets: number[],
  dt: number,
  fDirs: { x: number; y: number; z: number }[][] | null,
  lag: number = tune.fingerLag,
) {
  if (!chain) return;
  const { bones, rootParentQ, rootParentP, offsets, segLen, length } = chain;
  const n = bones.length;

  if (!tipInited) {
    smoothTip.copy(target);
    tipInited = true;
  }
  smoothTip.lerp(target, 1 - Math.exp(-dt * tune.aimLag * 2.2));

  goal.set(
    smoothTip.x + Math.sin(time * 1.1) * tune.sway,
    smoothTip.y + Math.sin(time * 0.83 + 1.3) * tune.sway * 0.8,
    smoothTip.z,
  );

  // FK 初始化（只用来拿根部世界位置）
  wp.length = n;
  wq.length = n;
  for (let i = 0; i < n; i++) {
    const parentQ = i === 0 ? rootParentQ : wq[i - 1];
    const parentP = i === 0 ? rootParentP : wp[i - 1];
    wp[i] = parentP.clone().add(offsets[i].clone().applyQuaternion(parentQ));
    wq[i] = parentQ.clone().multiply(bones[i].quaternion);
  }

  const P0 = wp[0].clone();
  const P1 = goal.clone();
  const chord = P0.distanceTo(P1);
  if (chord > length * 0.998) {
    P1.copy(P0).add(P1.clone().sub(P0).normalize().multiplyScalar(length * 0.996));
  }

  solveDroop(P0, P1, length, segLen, n);

  // 由关节位置反推世界朝向
  let w = rootParentQ.clone();
  for (let i = 0; i < n; i++) {
    if (i + 1 < n) {
      const cur = offsets[i + 1].clone().normalize().applyQuaternion(w);
      const want = wp[i + 1].clone().sub(wp[i]).normalize();
      if (cur.lengthSq() > 1e-9 && want.lengthSq() > 1e-9) {
        qAlign.setFromUnitVectors(cur, want);
        w = qAlign.clone().multiply(w);
      }
    }
    wq[i].copy(w);
  }

  const finite = wp.every((v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z));
  if (!finite) {
    for (let i = 0; i < n; i++) bones[i].quaternion.copy(chain.restQ[i]);
    tipErr = -1;
    return;
  }

  for (let i = 0; i < n; i++) {
    const parentQ = i === 0 ? rootParentQ : wq[i - 1];
    bones[i].quaternion.copy(parentQ).invert().multiply(wq[i]);
  }
  tipErr = wp[n - 1].distanceTo(P1);

  // ---------- 四条须子 ----------
  const avgCurl = fingers.length ? fingerState.reduce((a, b) => a + b, 0) / fingers.length : 0;

  // 手掌跟随：手指蜷起时，末端那节骨整体再压一点
  let handWQ = wq[n - 1].clone();
  if (fingers.length && tune.palmAmt > 0 && avgCurl > 0.01) {
    const qPalm = new THREE.Quaternion().setFromAxisAngle(fingers[0].axis, avgCurl * tune.palmAmt);
    handWQ = qPalm.clone().multiply(handWQ);
    const parentW = wq[n - 2] ?? rootParentQ;
    bones[n - 1].quaternion.copy(parentW).invert().multiply(handWQ);
  }

  const RATIO = [0.55, 0.3, 0.15];
  let fingerSum = 0;

  if (fDirs && fDirs.length >= 5) {
    // ---------- 3D 姿态重定向：逐段对齐到动捕给出的手指方向 ----------
    const toV = (v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z).normalize();

    const align = new THREE.Quaternion(); // 已由 modelBasis 承担

    for (let f = 0; f < fingers.length; f++) {
      const fc = fingers[f];
      const src = fingerMap[f] ?? 1;
      const dirs = fDirs[src];
      if (!dirs || dirs.length < 3) continue;

      const pi = fc.parentIdx;
      const parentWorld = pi === n - 1 || pi < 0 ? handWQ.clone() : wq[pi].clone();
      let w = parentWorld.clone();
      const worldQ: THREE.Quaternion[] = [];
      const aim = new THREE.Vector3();
      const cur = new THREE.Vector3();
      const maxJoint = tune.maxJoint;

      for (let j = 0; j < 3; j++) {
        const dMeas = toV(dirs[j]);
        const delta = new THREE.Quaternion().setFromUnitVectors(U_AXIS, dMeas);
        const rdBasis = fc.restDir[j].clone().applyMatrix4(modelBasisInv).normalize();
        aim.copy(rdBasis).applyQuaternion(delta).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();
        cur.copy(fc.restDir[j]).applyQuaternion(w).normalize();
        if (cur.lengthSq() < 1e-8 || aim.lengthSq() < 1e-8) {
          worldQ.push(w.clone());
          continue;
        }

        // 手伸直时方向差很小 → 直接贴回静止姿态，避免第一关节向后反折
        const rawAngle = cur.angleTo(aim);
        const q = new THREE.Quaternion();
        if (rawAngle < tune.deadZone) {
          q.identity();
        } else {
          q.setFromUnitVectors(cur, aim);
          // 单关节转角上限：弯曲分摊到三节，不让一个关节吃掉全部
          const ang = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
          if (ang > maxJoint) q.slerpQuaternions(QID, q, maxJoint / ang);
        }
        w = q.clone().multiply(w);

        // 扭转约束：绕段轴把带宽方向拉回手掌法线，避免布条翻面
        const segDir = fc.restDir[j].clone().applyQuaternion(w).normalize();
        const curX = new THREE.Vector3(1, 0, 0).applyQuaternion(w);
        const wantX = new THREE.Vector3(1, 0, 0).applyQuaternion(handWQ);
        const cx = curX.clone().projectOnPlane(segDir);
        const wx = wantX.clone().projectOnPlane(segDir);
        if (cx.lengthSq() > 1e-6 && wx.lengthSq() > 1e-6) {
          cx.normalize();
          wx.normalize();
          const roll = Math.atan2(cx.clone().cross(wx).dot(segDir), cx.dot(wx));
          if (Math.abs(roll) > 1e-4) {
            w.premultiply(new THREE.Quaternion().setFromAxisAngle(segDir, roll * tune.twist));
          }
        }

        worldQ.push(w.clone());
      }

      const blend = 1 - Math.exp(-dt * lag);
      const parents = [parentWorld, worldQ[0], worldQ[1]];
      for (let j = 0; j < 3 && j < fc.bones.length; j++) {
        const local = parents[j].clone().invert().multiply(worldQ[j]);
        fc.bones[j].quaternion.slerp(local, blend);
      }

      // 误差：实际段方向 vs 目标方向
      const errs: number[] = [];
      for (let j = 0; j < 3; j++) {
        const dMeas = toV(dirs[j]);
        const delta = new THREE.Quaternion().setFromUnitVectors(U_AXIS, dMeas);
        const rdBasis = fc.restDir[j].clone().applyMatrix4(modelBasisInv).normalize();
        aim.copy(rdBasis).applyQuaternion(delta).applyMatrix4(modelBasis).applyQuaternion(handWQ).normalize();
        const actual = fc.restDir[j].clone().applyQuaternion(worldQ[j]).normalize();
        errs.push((Math.acos(THREE.MathUtils.clamp(actual.dot(aim), -1, 1)) * 180) / Math.PI);
      }
      fingerErr[f] = errs;

      fingerState[f] += (THREE.MathUtils.clamp(fingerTargets[src] ?? 0, 0, 1) - fingerState[f]) * blend;
      fingerSum += fingerState[f];
    }
  } else {
    // ---------- 没有 3D 数据时退回标量弹簧 ----------
    for (let f = 0; f < fingers.length; f++) {
      const fc = fingers[f];
      const src = fingerMap[f] ?? 1;
      const want = THREE.MathUtils.clamp(fTargets[src] ?? curl, 0, 1);
      fingerState[f] += (want - fingerState[f]) * (1 - Math.exp(-dt * tune.fingerLag));
      const c = fingerState[f];
      fingerSum += c;
      const wobble = Math.sin(time * 2.1 + fc.phase) * 0.04;

      for (let j = 0; j < fc.bones.length; j++) {
        const g = Math.min(c, 1) * tune.fingerAmt * RATIO[j] + wobble * (j + 1) * 0.2;
        const omega = tune.fingerOmega - j * 5;
        const acc = (g - fc.ang[j]) * omega * omega - fc.vel[j] * 2 * 0.6 * omega;
        fc.vel[j] += acc * dt;
        // 只允许向前弯，禁止静止时向后反折
        fc.ang[j] = THREE.MathUtils.clamp(fc.ang[j] + fc.vel[j] * dt, 0, tune.maxJoint);

        const qWorld = new THREE.Quaternion().setFromAxisAngle(fc.axis, fc.ang[j]);
        if (j === 0 && tune.splay > 0) {
          // 伸直时向外扇开，让"布"的四根须子拉开
          const palmNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(handWQ).normalize();
          qWorld.premultiply(
            new THREE.Quaternion().setFromAxisAngle(palmNormal, (1 - c) * tune.splay * fc.side),
          );
        }
        const delta = fc.parentQ[j].clone().invert().multiply(qWorld).multiply(fc.parentQ[j]);
        const targetQ = fc.restQ[j].clone().premultiply(delta);
        fc.bones[j].quaternion.slerp(targetQ, 1 - Math.exp(-dt * lag));
      }
    }
  }
}

// ---------------- 主循环 ----------------
const clock = new THREE.Clock();
const smoothTarget = new THREE.Vector3(0, 6, 0);
let lastT = performance.now();
let firstHandLogged = false;
let handLostLogged = false;
let statusTimer = 0;
let fps = 60;

const hpDemo = params.has("hpDemo");
const reel = params.has("reel"); // 宣传片录屏模式：干净画面 + 自动运镜
const reelX = Number(params.get("reelx") ?? "0"); // 构图横向偏移
if (reel) {
  document.getElementById("logPanel")?.remove();
  view.r = 17.5;
  view.ty = 9.2;
  updateCamera();
  for (const sel of [".chips", ".panel", "#rpsScore", "#rpsStart", ".credit", "#gate"]) {
    document.querySelectorAll(sel).forEach((el) => ((el as HTMLElement).style.display = "none"));
  }
}
if (hpDemo) hpWrap.classList.add("on");
if (params.has("curl")) gestureCurl = Math.min(1, Number(params.get("curl")));

function demoHand(t: number): HandState {
  const bend = params.has("curl") ? Number(params.get("curl")) : 0.5 + 0.5 * Math.sin(t * 1.3);
  const pts = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  pts[0] = { x: 0.5, y: 0.9 };
  const seg = 0.07 - bend * 0.025;
  [0.37, 0.45, 0.53, 0.61].forEach((x, k) => {
    const mcp = { x, y: 0.63 };
    const splay = (k - 1.5) * 0.028;
    pts[5 + k * 4] = mcp;
    pts[6 + k * 4] = { x: mcp.x + splay * 0.6, y: mcp.y - seg };
    pts[7 + k * 4] = { x: mcp.x + splay * 1.1, y: mcp.y - seg * 1.7 };
    pts[8 + k * 4] = { x: mcp.x + splay * 1.5, y: mcp.y - seg * 2.2 };
  });
  pts[1] = { x: 0.4, y: 0.78 };
  pts[2] = { x: 0.33, y: 0.74 };
  pts[3] = { x: 0.28, y: 0.7 };
  pts[4] = { x: 0.24, y: 0.66 };
  // 合成 3D 手指方向，用来在无摄像头时验证重定向链路
  const fingerDirs = Array.from({ length: 5 }, (_, k) => {
    const b = bend * (0.85 + k * 0.04);
    return [0, 1, 2].map((j) => {
      const a = b * (0.55 - j * 0.2);
      return { x: 0, y: Math.cos(a), z: Math.sin(a) };
    });
  });

  return {
    present: true,
    palm: { x: 0.49, y: 0.75 },
    pinch: { x: 0.3, y: 0.66 },
    curl: bend,
    spread: 1 - bend * 0.6,
    roll: 0,
    speed: 0,
    gesture: bend > 0.6 ? "fist" : "open",
    points: pts,
    fingerDirs,
    fingerCurl: [bend, bend, bend, bend, bend],
    ext: [bend < 0.5, bend < 0.5, bend < 0.5, bend < 0.5, bend < 0.5],
    basis: { s: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, n: { x: 0, y: 0, z: 1 } },
  };
}

// ---------- 猜拳（反应式） ----------
const game = new RpsGame((params.get("scarf") as RPS | null) ?? null);
game.counter = params.has("counter");
if (params.has("rpsFast")) {
  game.thinkTime = 0.05;
  game.revealTime = 60; // 测试时把揭晓画面挂住，方便截图
}
if (params.has("reveal")) game.revealTime = Number(params.get("reveal"));
const rpsCountEl = document.getElementById("rpsCount") as HTMLDivElement;
const rpsLineEl = document.getElementById("rpsLine") as HTMLDivElement;
const rpsScoreEl = document.getElementById("rpsScore") as HTMLDivElement;
const rpsStartEl = document.getElementById("rpsStart") as HTMLButtonElement | null;
const rpsRootEl = document.getElementById("rps") as HTMLDivElement | null;
const modeBtnEl = document.getElementById("modeBtn") as HTMLButtonElement | null;

const chipHintEl = document.getElementById("chipHint");
const chipModeEl = document.getElementById("chipMode");

function applyMode() {
  if (rpsRootEl) rpsRootEl.style.display = gameMode ? "flex" : "none";
  if (modeBtnEl) modeBtnEl.textContent = t(gameMode ? "btnToMirror" : "btnToGame");
  statusEl.textContent = t(gameMode ? "modeGame" : "modeMirror");
  if (chipHintEl) chipHintEl.textContent = t(gameMode ? "chipHintGame" : "chipHintMirror");
  if (chipModeEl) chipModeEl.textContent = t(gameMode ? "chipModeGame" : "chipModeMirror");
  game.resetScore();
  game.phase = "wait";
  game.t = 0;
  game.hold = 0;
  game.lastSeen = null;
}
const langBtnEl = document.getElementById("langBtn") as HTMLButtonElement | null;
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

modeBtnEl?.addEventListener("click", () => {
  gameMode = !gameMode;
  applyMode();
});
if (rpsStartEl) rpsStartEl.textContent = t("btnResetScore");
rpsStartEl?.addEventListener("click", () => game.resetScore());

const RESULT_KEY = { win: "resultWin", lose: "resultLose", draw: "resultDraw" } as const;

/** 猜拳模式下须子的"显示形态"：在目标形态之间做慢速插值，避免瞬切 */
const dispCurls = [0.3, 0.3, 0.3, 0.3, 0.3];
const idleCurls = () => [tune.idleCurl, tune.idleCurl, tune.idleCurl, tune.idleCurl, tune.idleCurl];
let gameMode = params.has("game"); // 默认 = 普通动捕模式（须子跟手）；?game=1 = 猜拳模式
refreshLang(); // gameMode 已初始化，安全地按当前语言刷新一遍 UI
(window as unknown as { __rps: unknown }).__rps = () => ({ shape: dispCurls.map((v) => +v.toFixed(2)), phase: game.phase, hold: +game.hold.toFixed(2), seen: game.lastSeen, player: game.playerPick, scarf: game.scarfPick, result: game.result, gesture: hand.gesture, present: hand.present });

function updateRpsHud() {
  const thinking = game.phase === "think";
  const showing = game.phase === "reveal";

  const count = thinking ? "…" : "";
  if (rpsCountEl.textContent !== count) rpsCountEl.textContent = count;
  rpsCountEl.classList.toggle("show", thinking);

  if (showing && game.playerPick && game.scarfPick && game.result) {
    const html =
      `${t("youThrew")} ${t(game.playerPick)} · ${t("scarfThrew")} ${t(game.scarfPick)}<br>` +
      `<span class="${game.result}">${t(RESULT_KEY[game.result])}</span>`;
    if (rpsLineEl.innerHTML !== html) rpsLineEl.innerHTML = html;
    rpsLineEl.classList.add("show");
  } else if (game.phase === "wait") {
    const want = game.rounds === 0 ? t("gesturePrompt") : "";
    if (rpsLineEl.textContent !== want) rpsLineEl.textContent = want;
    rpsLineEl.classList.toggle("show", want !== "");
  } else {
    rpsLineEl.classList.remove("show");
  }

  const sc = `${t("scoreYou")} ${game.score.win} : ${game.score.lose} ${t("scoreScarf")}`;
  if (rpsScoreEl.textContent !== sc) rpsScoreEl.textContent = sc;
}

applyMode();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
  lastT = now;
  fps = fps * 0.9 + (1 / dt) * 0.1;

  if (useCamera && tracker?.ready) {
    const frame = stillImage ? tracker.detectImage(stillImage) : tracker.detect(video, now);
    hand = frame ? analyze(frame.screen, frame.world, dt, hand) : lostHand(hand, dt);
    if (hand.present) {
      targetNdc.set(hand.palm.x * 2 - 1, 1 - hand.palm.y * 2);
      fingerTargets = hand.fingerCurl;
    }
    if (hand.present && !firstHandLogged) {
      firstHandLogged = true;
      log(L("检测到手 ✓", "Hand detected ✓"), "ok");
    } else if (!hand.present && firstHandLogged && !handLostLogged) {
      handLostLogged = true;
      log(L("手离开画面", "Hand left the frame"), "warn");
    }
    gestureCurl += (hand.curl - gestureCurl) * Math.min(1, dt * 8);
    drawPreview();
  } else if (hpDemo || reel) {
    hand = demoHand(clock.getElapsedTime());
    if (!reel) drawPreview();
    fingerTargets = [hand.curl, hand.curl, hand.curl, hand.curl, hand.curl];
  } else {
    fingerTargets = [gestureCurl, gestureCurl, gestureCurl, gestureCurl, gestureCurl];
  }

  // ---------- 猜拳流程 ----------
  game.update(dt, () => {
    if (hand.gesture === "fist") return "rock";
    if (hand.gesture === "open") return "paper";
    if (hand.gesture === "scissors") return "scissors";
    return null;
  });
  const scarfCurls = game.curls();
  updateRpsHud();

  // ---------- 须子形态 ----------
  // 猜拳模式：出拳姿态直接回放照片里的动捕（POSES），不再由我们编动作
  const poseDirs =
    gameMode && game.phase === "reveal" && game.scarfPick ? POSES[game.scarfPick] : null;
  // 待机时用一个很轻的放松姿态，避免完全僵硬
  const targetShape = idleCurls();
  const shapeK = 1 - Math.exp(-dt * tune.shapeLag);
  for (let i = 0; i < dispCurls.length; i++) dispCurls[i] += (targetShape[i] - dispCurls[i]) * shapeK;
  if (gameMode) fingerTargets = dispCurls;

  if (reel) {
    // 缓慢的 8 字运镜，让围巾自己游动；reelx 可整体右移构图
    const t = clock.getElapsedTime();
    targetNdc.set(reelX + Math.sin(t * 0.5) * 0.18, 0.3 + Math.sin(t * 0.85) * 0.08);
  }
  raycaster.setFromCamera(targetNdc, camera);
  if (raycaster.ray.intersectPlane(plane, targetWorld)) {
    smoothTarget.lerp(targetWorld, 1 - Math.exp(-dt * 9));
    // 猜拳模式：不把手指方向灌给须子（否则会跟手型打架），只让位置跟随
    const fDirs = gameMode
      ? (poseDirs as { x: number; y: number; z: number }[][] | null)
      : hand.present && hand.fingerDirs.length >= 5
        ? hand.fingerDirs
        : null;
    drive(
      smoothTarget,
      clock.getElapsedTime(),
      gestureCurl,
      fingerTargets,
      dt,
      fDirs,
      gameMode ? tune.poseLag : tune.fingerLag,
    );
    marker.position.copy(goal);
    updateBoneVis();
  }
  statusTimer += dt;
  if (statusTimer > 0.5) {
    statusTimer = 0;
    const handTxt = useCamera ? (hand.present ? t("logHandOk") : t("logHandNo")) : t("logNoCam");
    logPanel.setStatus(`${Math.round(fps)}fps · ${handTxt}`);
  }

  renderer.render(scene, camera);
});

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  sizeHandPreview();
}
window.addEventListener("resize", resize);
resize();

// ---------------- 调参面板 ----------------
if (params.has("tune")) {
  const box = document.createElement("div");
  box.style.cssText =
    "position:absolute;left:16px;bottom:16px;z-index:30;padding:12px 14px;border-radius:12px;" +
    "background:rgba(12,8,24,0.88);border:1px solid rgba(168,123,255,0.3);color:#cfc2e6;" +
    "font:12px system-ui,sans-serif;width:250px;backdrop-filter:blur(8px)";

  const rows: [keyof typeof tune, string, number, number, number][] = [
    ["droop", "下垂强度", 0, 2, 0.02],
    ["anchorY", "锚点高度", -2, 12, 0.1],
    ["aimLag", "跟随速度", 2, 20, 0.2],
    ["sway", "飘动幅度", 0, 0.4, 0.01],
    ["fingerAmt", "须子弯曲", 0, 1.6, 0.02],
    ["maxJoint", "单关节上限", 0.1, 1.2, 0.02],
    ["deadZone", "死区", 0, 0.5, 0.01],
    ["twist", "扭转跟随", 0, 1, 0.02],
    ["palmAmt", "手掌跟随", 0, 1, 0.02],
    ["fingerLag", "须子跟随", 4, 40, 0.5],
    ["viewR", "镜头距离", 8, 40, 0.5],
    ["viewTy", "镜头高度", 2, 14, 0.1],
  ];

  for (const [k, label, min, max, step] of rows) {
    const row = document.createElement("label");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin:5px 0";
    const name = document.createElement("span");
    name.textContent = label;
    name.style.cssText = "width:60px;flex:none;color:#b6a6cc";
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(tune[k]);
    input.style.cssText = "flex:1;accent-color:#a87bff;min-width:0";
    const val = document.createElement("b");
    val.textContent = String(tune[k]);
    val.style.cssText = "width:36px;text-align:right;color:#a87bff";
    input.oninput = () => {
      (tune as Record<string, number>)[k] = Number(input.value);
      val.textContent = input.value;
      if (k === "viewR" || k === "viewTy") {
        view.r = tune.viewR;
        view.ty = tune.viewTy;
        updateCamera();
      }
    };
    row.append(name, input, val);
    box.append(row);
  }
  document.getElementById("app")?.append(box);
}
