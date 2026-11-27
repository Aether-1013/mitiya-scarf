import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 620, height: 780 } });
const p = await ctx.newPage();
await p.goto("https://[2602:fa59:2:62a2::1]:8443/scarf.html", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const b0 = window.__scarf.chain.bones[0];
  let root = b0; while (root.parent) root = root.parent;
  const res = { skinned: 0, info: [] };
  root.traverse((o) => {
    if (o.isSkinnedMesh) {
      res.skinned++;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      res.info.push({
        visible: o.visible, frustumCulled: o.frustumCulled,
        pos: o.position.toArray().map(v=>+v.toFixed(2)),
        idx: o.geometry.index ? o.geometry.index.count : -1,
        posAttr: o.geometry.attributes.position ? o.geometry.attributes.position.count : -1,
        matType: m?.type, opacity: m?.opacity, transparent: m?.transparent,
        alphaTest: m?.alphaTest, hasMap: !!m?.map, mapImg: !!m?.map?.image,
        color: m?.color ? "#" + m.color.getHexString() : null,
      });
    }
  });
  return res;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
