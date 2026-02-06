# 襄阳健康平台 - 简易部署指南

本指南假设使用 **本地构建，服务器运行** 的模式。
也就是在本地把代码打包好，只把必要文件上传到服务器。

## 1. 环境要求 (服务器)

*   **操作系统**: 推荐 CentOS 7.x / 8.x 或 Ubuntu 20.04+ (本指南以 Linux 为例)
*   **硬件配置**: 1核 CPU, 1G 内存以上
*   **必要的权限**: root 权限或 sudo 权限

## 2. 软件安装 (服务器)

请在服务器终端执行以下命令安装必要软件：

1.  **安装 Node.js (v18)**
    *(如果您使用宝塔面板，可以直接在“软件商店”搜索 Node.js 版本管理器进行安装，选择 v18+ 版本)*
    
    或者使用命令行安装：
    ```bash
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
    # 或者 Ubuntu: sudo apt-get install -y nodejs
    ```

2.  **安装 PM2 (进程管理器)**
    用于保持服务一直运行。
    ```bash
    npm install -g pm2
    ```

## 3. 本地打包与上传

**步骤 A: 在本地电脑执行构建**
并在项目根目录下运行终端：
```bash
# 1. 安装依赖 (如果还没装)
npm install

# 2. 构建项目 (生成 dist 文件夹)
npm run build
```

**步骤 B: 压缩打包**
请手动选中以下文件/文件夹，将它们压缩成一个 `deploy.zip` 文件：
1.  `dist` 文件夹 (构建好的程序)
2.  `prisma` 文件夹 (数据库结构)
3.  `package.json` 文件 (依赖描述)
4.  `.env` 文件 (配置文件)
5.  `dev.db` 文件 (数据库文件，保留你的测试数据)

**步骤 C: 上传到服务器**
1.  在服务器创建目录: `/www/wwwroot/xiangyang`
2.  将 `deploy.zip` 上传到该目录并解压。

## 4. 服务端安装与启动

登录服务器终端，进入项目目录执行：

```bash
cd /www/wwwroot/xiangyang

# 1. 安装后端依赖 (只安装生产环境需要的，速度快)
npm install --production

# 2. 更新数据库客户端
npx prisma generate

# 3. 启动服务 (使用 PM2)
pm2 start dist/index.js --name "xiangyang"
```

## 5. 配置域名与反向代理 (宝塔面板)

假设您使用宝塔面板 (BT Panel) 管理网站。

1.  **添加站点**:
    *   点击【网站】 -> 【添加站点】。
    *   **域名**: 填写您的域名 (例如 `health.example.com`)。
    *   **PHP版本**: 选择 "纯静态" (因为我们用 Node.js)。
    *   提交创建。

2.  **配置反向代理**:
    *   点击刚创建的站点设置 -> 【反向代理】 -> 【添加反向代理】。
    *   **代理名称**: `xiangyang` (随意填)
    *   **目标URL**: `http://127.0.0.1:3000`  (注意是 3000 端口)
    *   **发送域名**: `$host` (默认即可)
    *   点击【提交】。

3.  **重要优化 (必做)**:
    *   在反向代理列表中，点击【配置文件】(或者直接去【配置文件】手动修改 nginx 配置)。
    *   找到 `client_max_body_size` 设置 (如果没有就添加)，将其改大，否则无法上传头像。
    *   **添加位置**: 在 `server { ... }` 块内添加一行：
        ```nginx
        client_max_body_size 20M;
        ```
    *   保存。

## 6. 测试

1.  打开浏览器访问您的域名。
    *   应该能看到网站首页。
2.  测试登录后台 (`/admin`)。
    *   尝试登录管理员。
3.  **关键测试**: 
    *   尝试上传一张图片或头像，如果成功，说明 `client_max_body_size` 配置正确且 `uploads` 文件夹权限正常。

---
**常用维护命令:**

*   **查看日志**: `pm2 logs xiangyang`
*   **重启服务**: `pm2 restart xiangyang`
*   **停止服务**: `pm2 stop xiangyang`
