# 五子棋游戏国内部署指南

本文档提供了将五子棋游戏部署到国内服务器的详细步骤，其中前端部署到Gitee Pages，后端部署到腾讯云轻量应用服务器。

## 准备工作

1. 创建[Gitee](https://gitee.com)账号
2. 创建[腾讯云](https://cloud.tencent.com)账号
3. 将项目代码推送到Gitee仓库

## 部署步骤

### 1. 前端部署到Gitee Pages

1. 在Gitee上创建一个新的仓库，例如 `gomoku-game`
2. 将你的前端代码推送到这个仓库
3. 修改 `package.json` 文件中的 `homepage` 字段：
   ```json
   "homepage": "https://你的Gitee用户名.gitee.io/gomoku-game",
   ```
4. 在项目根目录创建或修改 `.env.production` 文件，设置后端服务URL：
   ```
   REACT_APP_SERVER_URL=http://你的服务器IP:3001
   ```
   如果有域名，可以使用域名：
   ```
   REACT_APP_SERVER_URL=https://你的域名
   ```
5. 安装依赖并构建项目：
   ```bash
   npm install
   npm run build
   ```
6. 将构建好的文件推送到Gitee仓库
7. 在仓库页面，点击 "服务" -> "Gitee Pages"，开启Gitee Pages服务
8. 等待部署完成，前端将会部署到Gitee Pages上
9. 访问 `https://你的Gitee用户名.gitee.io/gomoku-game` 查看部署的前端

### 2. 后端部署到腾讯云轻量应用服务器

1. 在腾讯云购买轻量应用服务器（推荐选择Node.js应用模板）
2. 连接到服务器（可以使用SSH或者腾讯云提供的网页终端）
3. 将后端代码上传到服务器：
   ```bash
   git clone https://gitee.com/你的用户名/gomoku-game.git
   cd gomoku-game/server
   npm install
   ```
4. 安装PM2来管理Node.js应用：
   ```bash
   npm install -g pm2
   ```
5. 创建 `.env` 文件，设置环境变量：
   ```
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://你的Gitee用户名.gitee.io/gomoku-game
   ```
6. 使用PM2启动服务：
   ```bash
   pm2 start server.js --name gomoku-backend
   ```
7. 配置防火墙，开放3001端口：
   ```bash
   # 如果是CentOS系统
   firewall-cmd --zone=public --add-port=3001/tcp --permanent
   firewall-cmd --reload
   
   # 如果是Ubuntu系统
   sudo ufw allow 3001/tcp
   sudo ufw reload
   ```
8. 如果有域名，可以配置域名解析到服务器IP，并配置Nginx反向代理

### 3. 配置Nginx反向代理（可选，如果有域名）

如果你有域名，可以配置Nginx反向代理，提供更好的访问体验：

1. 安装Nginx：
   ```bash
   # CentOS
   yum install -y nginx
   
   # Ubuntu
   apt-get install -y nginx
   ```

2. 创建Nginx配置文件：
   ```bash
   nano /etc/nginx/conf.d/gomoku.conf
   ```

3. 添加以下配置：
   ```nginx
   server {
       listen 80;
       server_name 你的域名;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. 测试配置并重启Nginx：
   ```bash
   nginx -t
   systemctl restart nginx
   ```

5. 配置SSL证书（推荐）：
   - 可以使用腾讯云提供的免费SSL证书
   - 或者使用Let's Encrypt的免费证书

## 验证部署

1. 访问Gitee Pages上的前端URL（例如：`https://你的Gitee用户名.gitee.io/gomoku-game`）
2. 测试游戏功能：
   - 人机对战模式
   - 创建多人游戏房间
   - 加入多人游戏房间

## 常见问题

### 前端无法连接到后端

如果前端无法连接到后端，请检查以下几点：

1. 确保`.env.production`文件中的`REACT_APP_SERVER_URL`设置正确
2. 确保后端服务正常运行（可以使用`pm2 status`查看）
3. 检查服务器防火墙是否开放了3001端口
4. 检查浏览器控制台是否有CORS错误
5. 确保后端服务的CORS配置允许来自Gitee Pages的请求

### 游戏房间无法创建

如果无法创建游戏房间，请检查以下几点：

1. 确保后端服务正常运行
2. 检查浏览器控制台是否有Socket.IO连接错误
3. 尝试刷新页面重新连接

## 更新部署

### 更新前端

当你更新前端代码后，需要重新构建并推送到Gitee：

```bash
npm run build
git add .
git commit -m "更新前端代码"
git push
```

然后在Gitee Pages页面重新部署。

### 更新后端

当你更新后端代码后，需要在服务器上拉取最新代码并重启服务：

```bash
cd gomoku-game
git pull
cd server
npm install  # 如果有新的依赖
pm2 restart gomoku-backend
```

## 其他国内部署选项

除了Gitee Pages + 腾讯云轻量应用服务器的组合，还有其他几种国内部署选项：

### 前端部署选项

1. **阿里云OSS**：对象存储服务，可用于托管静态网站
2. **腾讯云COS**：对象存储服务，支持静态网站托管
3. **华为云OBS**：对象存储服务，支持静态网站托管
4. **七牛云**：对象存储服务，提供免费CDN加速

### 后端部署选项

1. **阿里云ECS**：弹性计算服务，提供虚拟服务器
2. **华为云ECS**：弹性云服务器
3. **阿里云Serverless应用引擎SAE**：支持多种语言的应用部署
4. **腾讯云Serverless**：支持Node.js应用，按调用次数计费

## 性能优化建议

1. 使用CDN加速静态资源
2. 配置合理的缓存策略
3. 使用GZIP压缩响应内容
4. 考虑使用WebSocket代理，提高实时通信性能
5. 定期备份数据和代码 