/**
 * 部署到远端：上传 dist → 生成自签证书 → 起一个 Python HTTPS 静态服务（systemd）。
 * 用法：node tools/deploy.mjs
 */
import { Client } from "ssh2";
import fs from "node:fs";
import path from "node:path";

const HOST = process.env.DEPLOY_HOST ?? "2602:fa59:2:62a2::1";
const USER = process.env.DEPLOY_USER ?? "root";
const PASS = process.env.DEPLOY_PASS ?? "2qpTeAwFDmvw";
const PORT = Number(process.env.DEPLOY_PORT ?? 8443);
const ROOT = "/var/www/mitiya";
const DIST = path.resolve("dist");

const conn = new Client();

function exec(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => (out += d.toString()));
      stream.stderr.on("data", (d) => (out += d.toString()));
      stream.on("close", (code) => resolve({ code, out }));
    });
  });
}

function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, base));
    else out.push({ local: full, remote: path.relative(base, full).split(path.sep).join("/") });
  }
  return out;
}

const SERVE_PY = `#!/usr/bin/env python3
import http.server, ssl, os, socket, socketserver

os.chdir("${ROOT}")

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "public, max-age=600")
        super().end_headers()
    def log_message(self, fmt, *args):
        pass

class Server(socketserver.ThreadingTCPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    daemon_threads = True

httpd = Server(("::", ${PORT}), Handler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain("/etc/mitiya/cert.pem", "/etc/mitiya/key.pem")
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
print("serving %s on [::]:${PORT}" % "${ROOT}", flush=True)
httpd.serve_forever()
`;

conn
  .on("ready", async () => {
    try {
      console.log("1/6 准备目录…");
      await exec(`mkdir -p ${ROOT} /etc/mitiya`);

      console.log("2/6 上传 dist（约 54 MB）…");
      const files = walk(DIST);
      console.log(`    共 ${files.length} 个文件`);
      await new Promise((resolve, reject) => {
        conn.sftp(async (err, sftp) => {
          if (err) return reject(err);
          let done = 0;
          let bytes = 0;
          const dirs = new Set();
          try {
            for (const f of files) {
              const remoteDir = path.posix.dirname(`${ROOT}/${f.remote}`);
              if (!dirs.has(remoteDir)) {
                await exec(`mkdir -p '${remoteDir}'`);
                dirs.add(remoteDir);
              }
              await new Promise((res, rej) =>
                sftp.fastPut(f.local, `${ROOT}/${f.remote}`, (e) => (e ? rej(e) : res())),
              );
              bytes += fs.statSync(f.local).size;
              done++;
              if (done % 10 === 0 || done === files.length) {
                process.stdout.write(`    ${done}/${files.length}  ${(bytes / 1024 / 1024).toFixed(1)} MB\n`);
              }
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      console.log("3/6 生成自签证书…");
      const cert = await exec(
        `openssl req -x509 -nodes -newkey rsa:2048 -days 3650 ` +
          `-keyout /etc/mitiya/key.pem -out /etc/mitiya/cert.pem ` +
          `-subj "/CN=${HOST}" -addext "subjectAltName=IP:${HOST}" 2>&1 | tail -2`,
      );
      if (cert.code !== 0) throw new Error("证书生成失败: " + cert.out);

      console.log("4/6 写入服务脚本…");
      await new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          const stream = sftp.createWriteStream("/usr/local/bin/mitiya-serve.py");
          stream.on("close", resolve).on("error", reject);
          stream.end(SERVE_PY);
        });
      });
      await exec("chmod +x /usr/local/bin/mitiya-serve.py");

      console.log("5/6 配置 systemd…");
      const unit = `[Unit]
Description=Mitiya scarf static site (https)
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/local/bin/mitiya-serve.py
Restart=always
RestartSec=2
WorkingDirectory=${ROOT}

[Install]
WantedBy=multi-user.target
`;
      await new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          const stream = sftp.createWriteStream("/etc/systemd/system/mitiya.service");
          stream.on("close", resolve).on("error", reject);
          stream.end(unit);
        });
      });
      const up = await exec("systemctl daemon-reload && systemctl enable --now mitiya && sleep 1 && systemctl is-active mitiya");
      console.log("    " + up.out.trim());

      console.log("6/6 自检…");
      const check = await exec(
        `curl -sk -o /dev/null -w "https %{http_code} %{size_download}B\\n" https://[::1]:${PORT}/ ; ` +
          `curl -sk -o /dev/null -w "scarf %{http_code}\\n" https://[::1]:${PORT}/scarf.html ; ` +
          `curl -sk -o /dev/null -w "model %{http_code} %{size_download}B\\n" https://[::1]:${PORT}/models/mitiya/MItya.pmx ; ` +
          `du -sh ${ROOT}`,
      );
      console.log(check.out.trim());
      console.log(`\n完成：https://[${HOST}]:${PORT}/scarf.html`);
    } catch (e) {
      console.error("部署失败:", e.message);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
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
