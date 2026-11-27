/**
 * 快速更新：只上传 HTML / assets（跳过 models 与 wasm 这些大文件），用于改代码后的迭代部署。
 * 用法：node tools/deploy-fast.mjs
 */
import { Client } from "ssh2";
import fs from "node:fs";
import path from "node:path";

const HOST = process.env.DEPLOY_HOST ?? "2602:fa59:2:62a2::1";
const USER = process.env.DEPLOY_USER ?? "root";
const PASS = process.env.DEPLOY_PASS ?? "2qpTeAwFDmvw";
const ROOT = "/var/www/mitiya";
const DIST = path.resolve("dist");

const conn = new Client();

function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, base));
    else out.push({ local: full, remote: path.relative(base, full).split(path.sep).join("/") });
  }
  return out;
}

conn
  .on("ready", () => {
    const files = walk(DIST).filter(
      (f) => !f.remote.startsWith("models/") && !f.remote.startsWith("wasm/") && !f.remote.startsWith("refs/"),
    );
    conn.sftp(async (err, sftp) => {
      if (err) {
        console.error(err.message);
        conn.end();
        return;
      }
      for (const f of files) {
        const dir = path.posix.dirname(`${ROOT}/${f.remote}`);
        await new Promise((res) => conn.exec(`mkdir -p '${dir}'`, () => res()));
        await new Promise((res, rej) => sftp.fastPut(f.local, `${ROOT}/${f.remote}`, (e) => (e ? rej(e) : res())));
      }
      console.log(`uploaded ${files.length} files`);
      conn.exec("systemctl restart mitiya && sleep 1 && systemctl is-active mitiya", (e2, stream) => {
        let out = "";
        stream.on("data", (d) => (out += d.toString())).on("close", () => {
          console.log("service:", out.trim());
          conn.end();
        });
      });
    });
  })
  .on("error", (e) => {
    console.error("ssh error:", e.message);
    process.exitCode = 1;
  })
  .connect({
    host: HOST,
    port: 22,
    username: USER,
    password: PASS,
    readyTimeout: 20000,
    tryKeyboard: true,
    algorithms: { serverHostKey: ["ssh-ed25519", "ecdsa-sha2-nistp256", "ssh-rsa", "rsa-sha2-256", "rsa-sha2-512"] },
  })
  .on("keyboard-interactive", (n, i, l, p, finish) => finish([PASS]));
