import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 620, height: 780 } });
const p = await ctx.newPage();
const imgs = [];
p.on("response", r => { const u = r.url(); if (/\.(png|bmp|jpg)$/i.test(u)) imgs.push(`${r.status()} ${u.split("/").pop()} ${r.headers()["content-length"] ?? "?"}`); });
await p.goto("https://[2602:fa59:2:62a2::1]:8443/scarf.html", { waitUntil: "load", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
for (const t of [1500, 5000, 10000]) {
  await p.waitForTimeout(t === 1500 ? 1500 : 3500);
  const st = await p.evaluate(() => {
    const b0 = window.__scarf.chain.bones[0];
    let root = b0; while (root.parent) root = root.parent;
    let info = null;
    root.traverse(o => { if (o.isSkinnedMesh) { const m = Array.isArray(o.material) ? o.material[0] : o.material; info = { hasMap: !!m?.map, img: !!m?.map?.image }; } });
    return info;
  });
  console.log(`t≈${t}ms`, JSON.stringify(st));
}
console.log("图片请求:", imgs.slice(0, 8).join(" | ") || "none");
await p.screenshot({ path: "shots/deployed_late.png" });
await b.close();
