import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 760, height: 900 } })).newPage();
await p.goto("https://mitiya.pages.dev/scarf.html", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 90000 });
const credit = await p.evaluate(() => document.querySelector(".credit")?.textContent);
console.log("线上署名:", JSON.stringify(credit));
await b.close();
