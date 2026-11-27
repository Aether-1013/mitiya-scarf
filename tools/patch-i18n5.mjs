import fs from "node:fs";
const p = "src/scarfview.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace(`function refreshLang() {
  if (langBtnEl) langBtnEl.textContent = t("btnLang");
if (camBtn) camBtn.textContent = t("btnCamOn");
  applyMode();`,
`function refreshLang() {
  if (langBtnEl) langBtnEl.textContent = t("btnLang");
  applyMode();`);
s = s.replace(`if (langBtnEl) langBtnEl.textContent = t("btnLang");`,
`refreshLang();`);
fs.writeFileSync(p, s, "utf8");
console.log("refreshLang at init:", s.includes("refreshLang();"));
