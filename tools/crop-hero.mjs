/**
 * 从 1600x900 的渲染图里把围巾抠成透明背景的竖版素材。
 * 渲染背景是近黑色，按亮度做软键（lum 低 → 全透明），保留围巾边缘的过渡。
 * 用法：node tools/crop-hero.mjs [x] [y] [w] [h]
 */
import { chromium } from "playwright";
import fs from "node:fs";

const [x, y, w, h] = process.argv.slice(2).map(Number);
const CROP = {
  x: Number.isFinite(x) ? x : 600,
  y: Number.isFinite(y) ? y : 0,
  w: Number.isFinite(w) ? w : 500,
  h: Number.isFinite(h) ? h : 900,
};

const src = fs.readFileSync("shots/cover_src.png").toString("base64");

const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto("about:blank");
const dataUrl = await p.evaluate(
  async ({ b64, crop }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();

    const c = document.createElement("canvas");
    c.width = crop.w;
    c.height = crop.h;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

    // 软键：按亮度把近黑背景变透明
    const data = ctx.getImageData(0, 0, crop.w, crop.h);
    const px = data.data;
    const LO = 12;
    const HI = 42;
    for (let i = 0; i < px.length; i += 4) {
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const a = Math.max(0, Math.min(1, (lum - LO) / (HI - LO)));
      px[i + 3] = Math.round(px[i + 3] * a);
    }
    ctx.putImageData(data, 0, 0);
    return c.toDataURL("image/png");
  },
  { b64: src, crop: CROP },
);
await b.close();

fs.writeFileSync("shots/scarf_hero.png", Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(`saved shots/scarf_hero.png  (crop ${CROP.w}x${CROP.h} @ ${CROP.x},${CROP.y}, 背景已抠透明)`);
