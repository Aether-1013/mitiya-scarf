/**
 * 通过 SSH 在远端执行命令（密码登录）。
 * 用法：node tools/ssh-run.mjs "命令"
 */
import { Client } from "ssh2";

const HOST = process.env.DEPLOY_HOST ?? "2602:fa59:2:62a2::1";
const USER = process.env.DEPLOY_USER ?? "root";
const PASS = process.env.DEPLOY_PASS ?? "2qpTeAwFDmvw";

const cmd = process.argv.slice(2).join(" ") || "uname -a";

const conn = new Client();
conn
  .on("ready", () => {
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error("exec error:", err.message);
        conn.end();
        process.exitCode = 1;
        return;
      }
      let out = "";
      let errOut = "";
      stream
        .on("data", (d) => (out += d.toString()))
        .on("close", (code) => {
          if (out) process.stdout.write(out);
          if (errOut) process.stderr.write(errOut);
          console.log(`\n[exit ${code}]`);
          conn.end();
          if (code) process.exitCode = 1;
        })
        .stderr.on("data", (d) => (errOut += d.toString()));
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
  .on("keyboard-interactive", (name, instr, lang, prompts, finish) => finish([PASS]));
