# 考研英语真题

2010–2026 考研英语真题站：生词、小作文、大作文。Next.js 15 + Node 20+ + MySQL 8，配图/视频入库存 BLOB。字体使用系统字体栈，无外网 Google Fonts 依赖。

## 环境要求

- Node.js 20+
- MySQL 8

## 快速开始

1. 复制环境变量：

```bash
cp .env.example .env.local
```

编辑 `MYSQL_*`。生产环境请设置 `UPLOAD_PASSWORD`（上传、删除媒体、清空模块均需校验）。

2. 导入表结构：

```bash
npm run db:schema
# 或: mysql -h HOST -u USER -p < sql/schema.sql
```

若库已存在且需支持「我的作文」图片 kind=`draft`：

```bash
npm run db:migrate:draft
```

3. 安装依赖并启动：

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 功能

- 左侧年份导航；生词 / 小作文 / 大作文
- 本页浮层上传与编辑（写入 MySQL）
- 生词：逐条编辑、词性、文件批量覆盖导入
- 作文：题目配图、我的作文（仅图片）、修改后范文（TipTap）、讲解视频（仅文件）
- 可删除已有图片/视频，或一键「清空本模块」
- 上传限制：单图 ≤ 10MB（最多 9 张），视频 ≤ 80MB；保存时显示上传进度

## Docker 部署

对齐 `everyday`：`output: "standalone"`，`network_mode: host` 以便 `MYSQL_HOST=127.0.0.1` 连宿主机 MySQL。

```bash
# 确保 .env.local 已配置 MYSQL_* 与 UPLOAD_PASSWORD
docker compose build
docker compose up -d
```

默认监听宿主机 `3000`。查看日志：

```bash
docker compose logs -f
```

### 反向代理注意

若前面有 Nginx，需放宽上传体积，例如：

```nginx
client_max_body_size 100m;
proxy_read_timeout 300s;
```

## 安全建议

- 务必设置 `UPLOAD_PASSWORD`，勿将 `.env.local` 提交到仓库
- 本站为个人自用场景；若暴露公网，请配合防火墙 / 反向代理鉴权
