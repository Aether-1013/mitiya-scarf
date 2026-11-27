/**
 * 从 DNG 里抽出可用的 JPEG 预览：按 JPEG 标记链严格解析，只保留结构完整的。
 * 用法：node tools/dng-preview.mjs <out-dir> <file.dng> ...
 */
import fs from "node:fs";
import path from "node:path";

const [outDir, ...files] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

/** 从 soi 开始按标记链走，遇到 SOS 后在熵编码区找 EOI；结构不合法返回 -1 */
function walkJpeg(buf, soi) {
  let i = soi + 2;
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) return -1;
    const marker = buf[i + 1];

    if (marker === 0xd9) return i + 2; // EOI
    if (marker === 0xd8) return -1; // 嵌套 SOI，非法

    if (marker === 0xda) {
      // 进入熵编码数据，之后不再标记对齐，直接找 EOI
      for (let j = i + 2; j + 1 < buf.length; j++) {
        if (buf[j] === 0xff && buf[j + 1] === 0xd9) return j + 2;
      }
      return -1;
    }

    const segLen = buf.readUInt16BE(i + 2);
    if (segLen < 2) return -1;
    i += 2 + segLen;
  }
  return -1;
}

for (const f of files) {
  const buf = fs.readFileSync(f);
  const base = path.basename(f).replace(/\.[^.]+$/, "");

  const found = [];
  for (let i = 0; i + 1 < buf.length; i++) {
    if (buf[i] !== 0xff || buf[i + 1] !== 0xd8) continue;
    const end = walkJpeg(buf, i);
    if (end > i) found.push({ start: i, end, len: end - i });
  }

  found.sort((a, b) => b.len - a.len);
  const best = found.find((s) => s.len > 200_000);
  if (!best) {
    console.log(`${base}: 没有结构完整的预览（候选 ${found.length} 个）`);
    continue;
  }
  const out = path.join(outDir, `${base}.jpg`);
  fs.writeFileSync(out, buf.subarray(best.start, best.end));
  console.log(`${base}: ${(best.len / 1024).toFixed(0)} KB -> ${out}`);
}
