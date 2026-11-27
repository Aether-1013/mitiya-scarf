import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 700, height: 900 } });
const p = await ctx.newPage();
await p.goto("https://[2602:fa59:2:62a2::1]:8443/scarf.html", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(2000);
const r = await p.evaluate(() => {
  const bones = window.__scarf.chain.bones;
  let root = bones[0];
  while (root.parent) root = root.parent;
  const out = { meshes: [], lights: 0, rootType: root.type };
  root.traverse((o) => {
    if (o.isLight) out.lights++;
    if (o.isMesh || o.isSkinnedMesh) {
      out.meshes.push({
        type: o.type, name: o.name || "-", visible: o.visible,
        mat: Array.isArray(o.material) ? `array(${o.material.length})` : (o.material?.type ?? "?"),
        opacity: Array.isArray(o.material) ? o.material[0]?.opacity : o.material?.opacity,
        transparent: Array.isArray(o.material) ? o.material[0]?.transparent : o.material?.transparent,
        hasMap: Array.isArray(o.material) ? !!o.material[0]?.map?.image : !!o.material?.map?.image,
        scale: o.scale.toArray().map(v => +v.toFixed(3)),
        pos: o.position.toArray().map(v => +v.toFixed(2)),
      });
    }
  });
  return out;
});
console.log(JSON.stringify(r, null, 1).slice(0, 2000));
await b.close();
