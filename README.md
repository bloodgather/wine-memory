# Wine Memory

一个本地优先的酒款和鸡尾酒记录 PWA。部署成 HTTPS 网页后，可以在 iPhone Safari 里添加到主屏幕使用。

Production: https://wine-memory.pages.dev

## 本地运行

```bash
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

打开 `http://127.0.0.1:5173`。

## 部署前检查

```bash
npm.cmd run deploy:check
```

通过后会生成 `dist/`，这个目录就是可部署的静态网站。

## 推荐部署方式

### Cloudflare Pages

1. 把项目推到 GitHub。
2. Cloudflare Pages 选择该仓库。
3. Build command 填 `npm run build`。
4. Build output directory 填 `dist`。
5. 部署完成后用 HTTPS 地址访问。

### Vercel

项目已包含 `vercel.json`。导入仓库后，Vercel 会使用：

- Build command: `npm run build`
- Output directory: `dist`

### Netlify

项目已包含 `netlify.toml` 和 `_redirects`。导入仓库后会自动使用 `dist` 作为发布目录。

## 数据安全说明

当前数据保存在浏览器 IndexedDB，本地优先、不上传服务器。

- 同一个网站域名下再次打开，数据会保留。
- 换域名、清浏览器数据、无痕模式、卸载网站数据，都可能导致本地数据不可见或丢失。
- 部署到正式域名前，建议先在设置页导出 JSON 备份。
- 更换部署域名后，可以在新网站设置页导入 JSON 恢复。

严格来说，网页本地存储无法承诺“永不丢失”。真正要跨设备、跨域名长期保存，需要后续增加账号和云端数据库。
