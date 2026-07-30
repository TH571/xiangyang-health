# 向阳健康 - 部署指南

## 架构概览

```
用户 → https://xyjk.ren
         ├── 前端 (React SPA) — Vercel 静态托管
         └── /api/* → Vercel Serverless (Express + Prisma)
                                      └── Neon PostgreSQL (云端数据库)
                                            └── 阿里云 OSS (图片/视频存储)
```

**所有代码部署在 Vercel，无需管理云服务器。**

---

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + Vite 7 + TypeScript + Tailwind 4 |
| API | Express 4 (Vercel Serverless Function) |
| 数据库 | PostgreSQL (Neon) + Prisma ORM |
| 存储 | 阿里云 OSS (xyjk-data) |
| 域名 | xyjk.ren (Vercel DNS) |

---

## 本地开发

### 1. 环境变量

复制 `.env.production.example` 为 `.env`，填入必要配置：

```bash
cp .env.production.example .env
```

必要的环境变量：
- `DATABASE_URL` — Neon PostgreSQL 连接字符串
- `JWT_SECRET` — JWT 密钥
- `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` — 阿里云 OSS 密钥
- `OSS_BUCKET` / `OSS_DOMAIN` — OSS 存储配置

### 2. 启动

```bash
pnpm install            # 安装依赖
pnpm dev                # 前端 (Vite, 端口 5173)
pnpm server             # 后端 API (tsx, 端口 3000)
# 或一键启动:
pnpm dev:all            # 前后端同时启动
```

前端开发时通过 Vite proxy 将 `/api` 请求转发到 `localhost:3000`。

---

## 生产部署

### 自动部署 (Git 推送)

项目已关联 `TH571/xiangyang-health` 仓库，每次推送到 `master` 分支：

1. **Vercel 自动构建前端** → `vite build` → 输出到 `dist/public`
2. **Vercel 自动部署 API** → `api/index.ts` → Serverless Function
3. **Prisma Client 自动生成** → 构建时执行 `prisma generate`

### 环境变量 (Vercel Dashboard)

以下变量需在 Vercel 项目设置中配置：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `ALLOWED_ORIGINS` | 允许的跨域域名 |
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS Access Key |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS Secret Key |
| `OSS_BUCKET` | OSS 存储桶名称 (xyjk-data) |
| `OSS_DOMAIN` | OSS 访问域名 |

---

## 数据库

### 技术选型

- **Neon PostgreSQL** (Serverless PostgreSQL，免费版 0.5GB)
- **Prisma ORM** 管理数据库迁移

### 迁移数据库

```bash
# 推 schema 到数据库
DATABASE_URL="postgresql://..." pnpm exec prisma db push

# 生成 Prisma Client
pnpm exec prisma generate

# 查看数据
pnpm exec prisma studio
```

---

## 域名

- **主域名**: `https://xyjk.ren` (Vercel 托管)
- **后端 API**: 同域名 `/api/*` 路径

---

## 文件存储

所有图片/视频上传到阿里云 OSS (`xyjk-data` 存储桶，杭州区域)。

上传流程：
```
用户上传 → multer(内存) → 阿里云 OSS(直接存储)
```

---

## 故障排查

### API 返回 500

1. 检查 Vercel 部署日志
2. 确认 `DATABASE_URL` 环境变量是否正确
3. 确认 Neon 数据库是否在运行

### 图片上传失败

1. 检查 OSS 密钥是否过期
2. 确认 OSS 存储桶是否存在

### 数据问题

1. 使用 `prisma studio` 连接数据库查看
2. 或直接通过 Neon Console 管理数据