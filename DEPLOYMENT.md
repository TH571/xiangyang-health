# 前后端分离部署指南

## 概述

本项目已完成前后端分离改造：
- **前端**: Vite + React → 部署到腾讯云 Pages (静态托管)
- **后端**: Express + Prisma → 部署到云服务器

## 前端部署 (腾讯云 Pages)

### 1. 准备工作

确保项目根目录有以下文件：
- `.tencentcloud-pages.yml` - Pages 部署配置
- `package.json` - 包含构建脚本
- `vite.config.ts` - Vite 配置 (输出到 `dist/public`)

### 2. 环境变量配置

在腾讯云 Pages 控制台设置以下环境变量：

```env
VITE_API_BASE_URL=https://your-backend-server.com
```

### 3. 部署步骤

1. 登录腾讯云控制台
2. 进入「静态网站托管」服务
3. 创建新站点，关联 Git 仓库
4. 选择分支: `feature/frontend-backend-separation`
5. 配置构建设置：
   - **构建命令**: `pnpm vite build`
   - **输出目录**: `dist/public`
   - **环境变量**: 添加 `VITE_API_BASE_URL`
6. 部署完成后，腾讯云会提供访问域名

## 后端部署 (云服务器)

### 1. 环境变量配置

在服务器上创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥 (请使用强随机字符串)
JWT_SECRET="your-strong-random-secret-key"

# CORS 允许的前端域名
ALLOWED_ORIGINS="https://your-frontend.pages.dev,https://www.xiangyang.example.com"

# 服务端口
PORT=3000

# 环境
NODE_ENV=production
```

### 2. Nginx 配置 (如果使用)

```nginx
server {
    listen 80;
    server_name api.xiangyang.example.com;

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件直接访问
    location /uploads {
        alias /www/wwwroot/xiangyang/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 部署步骤

```bash
# 1. 拉取代码
git pull origin feature/frontend-backend-separation

# 2. 安装依赖
pnpm install

# 3. 构建后端
pnpm server-build

# 4. 迁移数据库 (如需要)
npx prisma migrate deploy

# 5. 启动服务 (使用 PM2)
pm2 start dist/server/index.js --name xiangyang-api

# 6. 配置开机自启
pm2 startup
pm2 save
```

### 4. 防火墙配置

确保以下端口开放：
- `3000` - Node.js API 服务
- `80/443` - HTTP/HTTPS (Nginx)

## 图片处理说明

上传的图片存储在后端服务器的 `uploads/` 目录，通过后端服务器访问：

```
前端: https://your-frontend.pages.dev
后端: https://your-backend-server.com
图片: https://your-backend-server.com/uploads/xxx.jpg
```

## 验证部署

### 本地验证

```bash
# 1. 启动后端
pnpm server

# 2. 设置前端环境变量
export VITE_API_BASE_URL=http://localhost:3000

# 3. 启动前端
pnpm dev

# 4. 测试功能
# - 访问 http://localhost:5173
# - 登录后台: http://localhost:5173/admin/login
# - 测试新闻增删改查
# - 测试图片上传
```

### 生产验证

1. 访问前端域名，检查页面加载
2. 尝试登录后台管理
3. 创建一篇新闻，上传图片
4. 检查图片是否正常显示
5. 验证所有 API 调用正常

## 常见问题

### Q: 图片显示 404
A: 检查 `VITE_API_BASE_URL` 是否正确配置，图片路径需要完整 URL

### Q: CORS 错误
A: 检查后端 `ALLOWED_ORIGINS` 环境变量是否包含前端域名

### Q: 401 未授权
A: 检查 Token 是否正确存储和发送，查看 Network 面板的请求头

### Q: 登录后跳转失效
A: 检查 API 响应拦截器中的 401 处理逻辑

## 回滚方案

如果部署出现问题：

```bash
# 切换回之前的分支
git checkout master

# 重新部署前端和后端
```

## 联系支持

如有问题，请联系开发团队或查看项目文档。
