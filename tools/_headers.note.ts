/**
 * Cloudflare Pages 的 _headers：给 wasm / 模型这类大文件长缓存。
 * 这样"预热下载"之后，MediaPipe 自己再去取时会命中缓存，不会重复下载。
 */
export const HEADERS = `/wasm/*
  Cache-Control: public, max-age=31536000, immutable

/models/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
console.log(HEADERS);
