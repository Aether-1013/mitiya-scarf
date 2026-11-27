import * as THREE from "three";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";

const canvas = document.getElementById("stage3d") as HTMLCanvasElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const gate = document.getElementById("gate") as HTMLDivElement;
const loadmsg = document.getElementById("loadmsg") as HTMLParagraphElement;

const params = new URLSearchParams(location.search);

THREE.DefaultLoadingManager.onError = (url) => console.log("LOADERR " + url);
THREE.DefaultLoadingManager.onLoad = () => console.log("LOADALL ok");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x0a0714, 1);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.5, 500);

// 简易轨道相机
const orbit = { az: 0, el: 0.06, r: 34, ty: 9.5 };

function updateCamera() {
  const { az, el, r, ty } = orbit;
  camera.position.set(
    Math.sin(az) * Math.cos(el) * r,
    ty + Math.sin(el) * r,
    Math.cos(az) * Math.cos(el) * r,
  );
  camera.lookAt(0, ty, 0);
}
updateCamera();

let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener("pointerup", () => (dragging = false));
window.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  orbit.az -= (e.clientX - lastX) * 0.006;
  orbit.el = Math.max(-0.6, Math.min(1.1, orbit.el + (e.clientY - lastY) * 0.004));
  lastX = e.clientX;
  lastY = e.clientY;
  updateCamera();
});
canvas.addEventListener("wheel", (e) => {
  orbit.r = Math.max(12, Math.min(80, orbit.r + e.deltaY * 0.03));
  updateCamera();
});

// 灯光
scene.add(new THREE.HemisphereLight(0xdfe4ff, 0x2a1b46, 2));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(6, 18, 14);
scene.add(key);
const fill = new THREE.DirectionalLight(0xb08cff, 1.4);
fill.position.set(-10, 8, 12);
scene.add(fill);
const rim = new THREE.DirectionalLight(0x8ef0d8, 1.2);
rim.position.set(0, 6, -16);
scene.add(rim);

// 背景球
const bg = new THREE.Mesh(
  new THREE.SphereGeometry(160, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0x140d24, side: THREE.BackSide }),
);
scene.add(bg);

const bones: THREE.Bone[] = [];
const meshes: THREE.Mesh[] = [];

const loader = new MMDLoader();
loader.load(
  "/models/mitiya/MItya.pmx",
  (data) => {
    const model = data as unknown as THREE.Object3D;
    scene.add(model);

    model.traverse((o) => {
      const b = o as THREE.Bone;
      if (b.isBone) bones.push(b);
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        meshes.push(m);
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const fovRad = (camera.fov * Math.PI) / 180;
    const fitH = size.y / (2 * Math.tan(fovRad / 2));
    const fitW = size.x / (2 * Math.tan(fovRad / 2) * camera.aspect);
    orbit.ty = center.y;
    orbit.r = Math.max(fitH, fitW) * 1.2;
    updateCamera();

    if (params.has("info")) {
      const info = meshes.slice(0, 6).map((m) => {
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
        const tex = mat.map as THREE.Texture | null;
        return {
          mesh: m.name,
          type: mat.type,
          color: mat.color ? `#${mat.color.getHexString()}` : null,
          opacity: +mat.opacity.toFixed(2),
          transparent: mat.transparent,
          map: tex?.image
            ? `${(tex.image as { width: number }).width}x${(tex.image as { height: number }).height}`
            : "none",
          colorSpace: tex?.colorSpace,
          attrs: Object.keys(m.geometry.attributes).join(","),
          normals: m.geometry.attributes.normal ? "y" : "n",
        };
      });
      console.log("INFO " + JSON.stringify(info));
    }

    if (params.get("dbg") === "wire") {
      for (const m of meshes) m.material = new THREE.MeshBasicMaterial({ color: 0x66ffcc, wireframe: true });
      scene.add(new THREE.AxesHelper(12));
      scene.add(new THREE.GridHelper(60, 24, 0x445566, 0x223044));
    }

    if (params.get("dbg") === "basic") {
      for (const m of meshes) {
        const src = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
        m.material = new THREE.MeshBasicMaterial({
          map: src.map ?? null,
          color: src.map ? 0xffffff : 0xff4488,
          side: THREE.DoubleSide,
        });
      }
    }

    if (params.get("dbg") === "white") {
      for (const m of meshes) {
        const src = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
        m.material = new THREE.MeshStandardMaterial({
          map: src.map ?? null,
          color: 0xffffff,
          side: THREE.DoubleSide,
          roughness: 0.6,
          metalness: 0,
        });
      }
    }

    statusEl.textContent = `骨骼 ${bones.length} · 网格 ${meshes.length} · 高 ${size.y.toFixed(1)}`;
    gate.classList.add("hide");
    document.body.dataset.ready = "1";
  },
  (xhr) => {
    if (xhr.total) loadmsg.textContent = `${Math.round((xhr.loaded / xhr.total) * 100)}%`;
  },
  (err) => {
    console.error(err);
    loadmsg.textContent = `加载失败：${err instanceof Error ? err.message : String(err)}`;
  },
);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
