/**
 * 一条命令发布到 Cloudflare Pages（自动带上本机代理）。
 * 用法：node tools/deploy-pages.mjs
 *
 * 前提：先 `npx wrangler login` 过一次（OAuth 过期时需要在有代理的环境里重登）。
 */
import { spawnSync } from "node:child_process";

const PROXY = process.env.MITIYA_PROXY ?? "http://127.0.0.1:10808";
const PROJECT = process.env.MITIYA_PAGES_PROJECT ?? "mitiya";

const env = {
  ...process.env,
  HTTPS_PROXY: PROXY,
  HTTP_PROXY: PROXY,
  NO_PROXY: "localhost,127.0.0.1,::1",
};

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8", env, shell: true });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  // 只打印有用行，避免刷屏
  for (const line of out.split(/\r?\n/)) {
    if (/built in|Uploading|Success|Deploying|Deployment complete|ERROR|error/i.test(line)) {
      console.log(line.trim());
    }
  }
  return { ok: r.status === 0 || /Deployment complete/i.test(out), out };
}

console.log("› 构建");
const build = run("npm", ["run", "build"], "build");
if (!build.ok) {
  console.error("构建失败");
  process.exit(1);
}

console.log(`› 上传到 Pages「${PROJECT}」（代理 ${PROXY}）`);
const deploy = run(
  "npx",
  ["wrangler", "pages", "deploy", "dist", "--project-name", PROJECT, "--branch", "main", "--commit-dirty=true"],
  "deploy",
);

const m = deploy.out.match(/https:\/\/[a-z0-9]+\.mitiya\.pages\.dev/);
if (!deploy.ok) {
  console.error("部署失败，完整输出：\n" + deploy.out.slice(-1500));
  process.exit(1);
}
console.log(`\n✓ 已发布：https://${PROJECT}.pages.dev  （本次构建 ${m ? m[0] : ""}）`);
