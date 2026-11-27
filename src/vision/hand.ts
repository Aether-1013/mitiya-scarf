import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { L } from "../ui/i18n";
import type { Pt } from "./gesture";

export type LandmarkFrame = {
  /** 屏幕空间归一化 21 点（x 已镜像） */
  screen: Pt[];
  /** 真实三维坐标（米，原点在手掌中心），21 点 */
  world: { x: number; y: number; z: number }[];
};

export class HandTracker {
  private lm: HandLandmarker | null = null;
  private lastTs = -1;
  delegate: "GPU" | "CPU" = "GPU";

  get ready() {
    return this.lm !== null;
  }

  async init(onProgress?: (msg: string) => void, mode: "VIDEO" | "IMAGE" = "VIDEO") {
    onProgress?.(L("加载推理引擎…", "Loading inference engine…"));
    const fileset = await FilesetResolver.forVisionTasks("/wasm");

    const build = (delegate: "GPU" | "CPU") =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate },
        runningMode: mode,
        numHands: 1,
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      });

    onProgress?.(L("加载手部模型…", "Loading hand model…"));
    try {
      this.lm = await build("GPU");
      this.delegate = "GPU";
    } catch {
      this.lm = await build("CPU");
      this.delegate = "CPU";
    }
    onProgress?.(`引擎就绪（${this.delegate}）`);
  }

  /** 静态图片检测（IMAGE 模式） */
  detectImage(img: HTMLImageElement): LandmarkFrame | null {
    if (!this.lm) return null;
    const res = this.lm.detect(img);
    return this.pack(res);
  }

  private pack(res: {
    landmarks?: { x: number; y: number }[][];
    worldLandmarks?: { x: number; y: number; z: number }[][];
  }): LandmarkFrame | null {
    const first = res.landmarks?.[0];
    if (!first) return null;
    const screen: Pt[] = first.map((q) => ({ x: 1 - q.x, y: q.y }));
    const wl = res.worldLandmarks?.[0];
    const world =
      wl && wl.length === first.length
        ? wl.map((q) => ({ x: q.x, y: q.y, z: q.z }))
        : first.map((q) => ({ x: q.x, y: q.y, z: 0 }));
    return { screen, world };
  }

  /** 返回屏幕空间 21 点 + 世界坐标 21 点 */
  detect(video: HTMLVideoElement, tsMs: number): LandmarkFrame | null {
    if (!this.lm || video.readyState < 2) return null;
    const ts = Math.max(this.lastTs + 1, Math.round(tsMs));
    this.lastTs = ts;
    return this.pack(this.lm.detectForVideo(video, ts));
  }
}
