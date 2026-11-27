import fs from "node:fs";

// scarfview: 补 fps
let s = fs.readFileSync("src/scarfview.ts", "utf8");
s = s.replace("let statusTimer = 0;", "let statusTimer = 0;\nlet fps = 60;");
s = s.replace(`  const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
  lastT = now;`,
`  const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
  lastT = now;
  fps = fps * 0.9 + (1 / dt) * 0.1;`);
fs.writeFileSync("src/scarfview.ts", s, "utf8");

// logPanel: getUserMedia 存在性判断
let l = fs.readFileSync("src/ui/logPanel.ts", "utf8");
l = l.replace(`    this.log(\`摄像头 API：\${navigator.mediaDevices?.getUserMedia ? "可用" : "不存在"}\`, 
      navigator.mediaDevices?.getUserMedia ? "ok" : "error");`,
`    const hasGum = typeof (navigator.mediaDevices ?? ({} as MediaDevices)).getUserMedia === "function";
    this.log(\`摄像头 API：\${hasGum ? "可用" : "不存在"}\`, hasGum ? "ok" : "error");`);
fs.writeFileSync("src/ui/logPanel.ts", l, "utf8");
console.log("fps:", s.includes("fps = fps * 0.9"), "| gum:", l.includes("hasGum"));
