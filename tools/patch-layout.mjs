import fs from "node:fs";
const p = "scarf.html";
let s = fs.readFileSync(p, "utf8");

s = s.replace(`      #rpsLine {
        margin-top: 8px; font-size: 20px; font-weight: 700; color: #f4ecff;
        text-shadow: 0 2px 14px rgba(0,0,0,0.7);
        opacity: 0; transition: opacity 0.25s ease;
        text-align: center; line-height: 1.7;
      }`,
`      #rpsLine {
        position: absolute; top: 72px; left: 50%; transform: translateX(-50%);
        padding: 10px 22px; border-radius: 14px;
        background: rgba(10,7,20,0.72); border: 1px solid rgba(168,123,255,0.28);
        backdrop-filter: blur(10px);
        font-size: 19px; font-weight: 700; color: #f4ecff;
        opacity: 0; transition: opacity 0.25s ease;
        text-align: center; line-height: 1.6; white-space: nowrap;
      }`);

s = s.replace(`      #rpsStart {
        position: absolute; bottom: 76px; left: 50%; transform: translateX(-50%);
        width: auto; margin: 0; padding: 11px 22px; font-size: 14px; border-radius: 999px;
        pointer-events: auto; z-index: 40;
      }`,
`      #rpsStart {
        position: absolute; right: 18px; bottom: 64px;
        width: auto; margin: 0; padding: 8px 14px; font-size: 12px; border-radius: 999px;
        pointer-events: auto; z-index: 40;
      }`);

fs.writeFileSync(p, s, "utf8");
console.log("layout patched:", s.includes("top: 72px"), s.includes("right: 18px"));
