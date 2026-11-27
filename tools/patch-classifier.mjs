import fs from "node:fs";
const p = "src/vision/gesture.ts";
let s = fs.readFileSync(p, "utf8");

// 用"手指方向与手掌轴向的夹角"判定伸直，替代关节链角度（对旋转更鲁棒）
s = s.replace(`  for (const [mcp, pip, dip, tip] of FINGER_PTS) {
    const s1 = sub(world[pip], world[mcp]);
    const s2 = sub(world[dip], world[pip]);
    const s3 = sub(world[tip], world[dip]);

    fingerDirs.push([toLocal(norm(s1)), toLocal(norm(s2)), toLocal(norm(s3))]);

    // 近节与中节夹角：伸直约 0°，蜷起 > 70°
    const a1 = Math.acos(clamp(dot(norm(s1), norm(s2)), -1, 1));
    const a2 = Math.acos(clamp(dot(norm(s2), norm(s3)), -1, 1));
    const bend = a1 + a2 * 0.6;
    fingerCurl.push(clamp(bend / 1.9));
    extended.push(a1 < 0.55 && a2 < 0.75);
  }`,
`  FINGER_PTS.forEach(([mcp, pip, dip, tip], fi) => {
    const s1 = sub(world[pip], world[mcp]);
    const s2 = sub(world[dip], world[pip]);
    const s3 = sub(world[tip], world[dip]);

    fingerDirs.push([toLocal(norm(s1)), toLocal(norm(s2)), toLocal(norm(s3))]);

    // 伸直判据：掌指关节→指尖 的连线，相对于"手掌轴向 up"的夹角。
    // 这个量与手的整体朝向无关，比关节链角度稳得多。
    const dirMT = norm(sub(world[tip], world[mcp]));
    const ang = Math.acos(clamp(dot(dirMT, up), -1, 1));

    // 拇指天生外张，阈值放宽
    const thresh = fi === 0 ? 1.25 : 0.95;
    extended.push(ang < thresh);
    fingerCurl.push(clamp((ang - 0.35) / 1.15));
  });`);

// 剪刀：去掉过严的张开要求
s = s.replace(`  else if (extended[1] && extended[2] && !extended[3] && !extended[4] && idxMidSep > 0.55) g = "scissors";`,
`  else if (extended[1] && extended[2] && !extended[3] && !extended[4]) g = "scissors";`);

fs.writeFileSync(p, s, "utf8");
console.log("rewritten:", s.includes("这个量与手的整体朝向无关"), !s.includes("idxMidSep > 0.55"));
