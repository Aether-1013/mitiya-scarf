import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto("https://mitiya.pages.dev/scarf.html?lang=en", { waitUntil: "domcontentloaded", timeout: 45000 });
const info = await p.evaluate(() => ({
  script: [...document.querySelectorAll("script[src]")].map(s => s.getAttribute("src")).join(","),
  title: document.querySelector(".panel h1")?.textContent,
  cam: document.getElementById("startCam")?.textContent,
  log: document.querySelector("#logPanel > div")?.textContent?.slice(0, 10),
}));
console.log(JSON.stringify(info));
await b.close();
