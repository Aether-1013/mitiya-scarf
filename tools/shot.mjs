import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173/preview.html";
const out = process.argv[3] ?? "shots/preview.png";
const w = Number(process.argv[4] ?? 1500);
const h = Number(process.argv[5] ?? 700);
const budget = Number(process.argv[6] ?? 60000);

const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });

const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => logs.push(`[failed] ${r.url()} ${r.failure()?.errorText ?? ""}`));
page.on("response", (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });

await page.goto(url, { waitUntil: "load" });
let ready = false;
try {
  await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: budget });
  ready = true;
} catch {
  logs.push(`[warn] ready flag not set within ${budget}ms`);
}

await page.waitForTimeout(800);
await page.screenshot({ path: out });
await browser.close();

const text = logs.join("\n");
console.log(text.length > 6000 ? text.slice(0, 3000) + "\n...\n" + text.slice(-3000) : text || "(no console output)");
console.log(`ready=${ready} saved -> ${out}`);

