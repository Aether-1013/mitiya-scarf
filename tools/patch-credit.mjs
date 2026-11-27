import fs from "node:fs";
for (const f of ["scarf.html", "model.html"]) {
  let s = fs.readFileSync(f, "utf8");
  s = s.replace('<div class="credit">model: HoYoverse / 樱MMD / _qiuu秋</div>', '<div class="credit">model: HoYoverse</div>');
  fs.writeFileSync(f, s, "utf8");
  console.log(f, "->", /model: HoYoverse</.test(s));
}
