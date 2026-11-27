import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, url] of [["dev","http://localhost:5173/scarf.html"], ["prod","http://localhost:4173/scarf.html"]]) {
  const p = await b.newPage({ viewport: { width: 620, height: 780 } });
  const bad = [];
  p.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split("/").pop()}`); });
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
  await p.waitForTimeout(2000);
  const hasMesh = await p.evaluate(() => {
    const b0 = window.__scarf.chain.bones[0];
    let r = b0; while (r.parent) r = r.parent;
    let found = 0;
    r.traverse(o => { if (o.isSkinnedMesh) found++; });
    return found;
  });
  console.log(tag, "skinnedMeshes:", hasMesh, "| 4xx:", bad.slice(0,3));
  await p.screenshot({ path: `shots/ab_${tag}.png` });
  await p.close();
}
await b.close();
