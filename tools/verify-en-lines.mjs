import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 820, height: 940 } })).newPage();
await p.goto("https://mitiya.pages.dev/scarf.html?lang=en", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
await p.waitForTimeout(600);
const lines = await p.evaluate(() => [...document.querySelectorAll("#logPanel > div:nth-child(2) > div")].map(d => d.textContent?.trim()));
console.log(lines.slice(0, 9).join("\n"));
await b.close();
