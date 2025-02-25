# 五子棋游戏自有服务器部署指南

本文档提供了将五子棋游戏部署到自有服务器的详细步骤，其中前端部署到GitHub Pages，后端部署到自有服务器。

## 准备工作

1. 创建[GitHub](https://github.com)账号（如果没有）
2. 准备一台服务器（本指南使用IP地址为212.192.221.50的服务器为例）
3. 确保服务器上安装了以下软件：
   - Git
   - Node.js (v14+)
   - npm (v6+)

## 部署步骤

### 1. 部署后端服务到自有服务器

#### 方法一：使用部署脚本（推荐）

1. 将项目代码克隆到本地：
   ```bash
   git clone https://github.com/java-ys/gomoku-game.git
   cd gomoku-game
   ```

2. 将部署脚本上传到服务器：
   ```bash
   scp server-deploy.sh user@212.192.221.50:~/
   ```

3. 登录到服务器：
   ```bash
   ssh user@212.192.221.50
   ```

4. 运行部署脚本：
   ```bash
   chmod +x ~/server-deploy.sh
   ~/server-deploy.sh
   ```

5. 按照脚本提示完成部署
6. 部署完成后，后端服务将运行在 `http://212.192.221.50:3001`

#### 方法二：手动部署

如果你不想使用部署脚本，也可以手动部署后端服务：

1. 登录到服务器：
   ```bash
   ssh user@212.192.221.50
   ```

2. 克隆项目代码：
   ```bash
   git clone https://github.com/java-ys/gomoku-game.git
   cd gomoku-game/server
   ```

3. 安装依赖：
   ```bash
   npm install
   ```

4. 创建环境变量文件：
   ```bash
   cat > .env << EOL
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://java-ys.github.io/gomoku-game
   EOL
   ```

5. 安装PM2（如果尚未安装）：
   ```bash
   npm install -g pm2
   ```

6. 使用PM2启动服务：
   ```bash
   pm2 start server.js --name gomoku-backend
   pm2 save
   pm2 startup
   ```

7. 配置防火墙，开放3001端口：
   ```bash
   # 如果是CentOS系统
   sudo firewall-cmd --zone=public --add-port=3001/tcp --permanent
   sudo firewall-cmd --reload
   
   # 如果是Ubuntu系统
   sudo ufw allow 3001/tcp
   sudo ufw reload
   ```

### 2. 更新前端配置

在部署前端之前，需要更新前端配置，使其连接到自有服务器上的后端服务：

1. 打开项目根目录下的`.env.production`文件
2. 将`REACT_APP_SERVER_URL`的值设置为自有服务器上的后端服务URL：
   ```
   REACT_APP_SERVER_URL=http://212.192.221.50:3001
   ```
3. 保存文件并提交到GitHub仓库

### 3. 部署前端到GitHub Pages

1. 确保项目的`package.json`文件中已经配置了正确的`homepage`字段：
   ```json
   "homepage": "https://java-ys.github.io/gomoku-game",
   ```

2. 安装`gh-pages`包（如果尚未安装）：
   ```bash
   npm install --save-dev gh-pages
   ```

3. 确保`package.json`文件中包含以下脚本：
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build",
     // 其他脚本...
   }
   ```

4. 构建并部署前端：
   ```bash
   npm run deploy
   ```

5. 等待部署完成，前端将会部署到GitHub Pages上
6. 访问`https://java-ys.github.io/gomoku-game`查看部署的前端

## 验证部署

1. 访问GitHub Pages上的前端URL（例如：`https://java-ys.github.io/gomoku-game`）
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
5. 确保后端服务的CORS配置允许来自GitHub Pages的请求

### 游戏房间无法创建

如果无法创建游戏房间，请检查以下几点：

1. 确保后端服务正常运行
2. 检查浏览器控制台是否有Socket.IO连接错误
3. 尝试刷新页面重新连接

## 更新部署

### 更新前端

当你更新前端代码后，只需再次运行：
```bash
npm run deploy
```

### 更新后端

当你更新后端代码后，需要在服务器上拉取最新代码并重启服务：

```bash
cd ~/gomoku-game
git pull
cd server
npm install  # 如果有新的依赖
pm2 restart gomoku-backend
```

## 使用Nginx作为反向代理（可选）

如果你想使用Nginx作为反向代理，可以按照以下步骤操作：

1. 安装Nginx：
   ```bash
   # CentOS
   sudo yum install -y nginx
   
   # Ubuntu
   sudo apt-get install -y nginx
   ```

2. 创建Nginx配置文件：
   ```bash
   sudo nano /etc/nginx/conf.d/gomoku.conf
   ```

3. 添加以下配置：
   ```nginx
   server {
       listen 80;
       server_name 212.192.221.50;  # 替换为你的域名，如果没有域名可以使用服务器IP
       
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
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. 配置SSL证书（推荐）：
   - 可以使用Let's Encrypt的免费证书
   - 或者使用其他SSL证书提供商

## 监控和日志

### 使用PM2监控

PM2提供了监控和日志功能，你可以使用以下命令：

1. 查看服务状态：
   ```bash
   pm2 status
   ```

2. 查看日志：
   ```bash
   pm2 logs gomoku-backend
   ```

3. 查看监控面板：
   ```bash
   pm2 monit
   ```

### 使用Nginx日志

如果你使用Nginx作为反向代理，可以查看Nginx的日志：

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 自定义域名

如果你有自己的域名，可以将其指向你的服务器IP地址，然后更新配置：

1. 在你的域名注册商处，将域名的A记录指向你的服务器IP地址
2. 更新Nginx配置中的`server_name`字段
3. 更新前端配置中的`REACT_APP_SERVER_URL`字段
4. 更新后端配置中的`FRONTEND_URL`字段

## 安全建议

1. 配置防火墙，只开放必要的端口
2. 使用HTTPS而不是HTTP
3. 定期更新服务器软件
4. 配置自动备份
5. 监控服务器安全日志 