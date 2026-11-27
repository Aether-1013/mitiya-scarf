import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173/scarf.html";

const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const page = await browser.newPage({
  viewport: { width: 640, height: 900 },
  permissions: ["camera"],
});

const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 60000 });

const info = await page.evaluate(() => {
  const btn = document.getElementById("startCam");
  const cs = getComputedStyle(btn);
  const r = btn.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return {
    pointerEvents: cs.pointerEvents,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    topElementAtCenter: hit ? `${hit.tagName}#${hit.id}.${hit.className}` : "none",
  };
});
console.log("BUTTON", JSON.stringify(info));

await page.click("#startCam", { timeout: 5000 }).catch((e) => console.log("CLICK FAILED: " + e.message));

for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(2000);
  const status = await page.textContent("#status");
  console.log(`t+${(i + 1) * 2}s status: ${status}`);
  if (/追踪中|不可用|失败/.test(status ?? "")) break;
}

await page.screenshot({ path: "shots/camera_test.png" });
await browser.close();
console.log(logs.slice(0, 40).join("\n"));
