# 五子棋游戏部署指南

本文档提供了将五子棋游戏部署的详细步骤，其中前端部署到GitHub Pages，后端部署到Render平台。

## 准备工作

1. 创建[GitHub](https://github.com)账号（如果没有）
2. 创建[Render](https://render.com)账号
3. 将项目代码推送到GitHub仓库

## 部署步骤

### 1. 部署后端服务到Render

#### 方法一：使用Blueprint（推荐）

1. 登录Render账号
2. 点击Dashboard中的"New Blueprint"按钮
3. 选择包含项目代码的GitHub仓库
4. Render会自动检测`render.yaml`文件并创建后端服务
5. 点击"Apply"按钮开始部署
6. 等待部署完成，Render会提供后端服务的URL（例如：`https://gomoku-game-backend.onrender.com`）
7. **记下这个URL，后面需要用到**

#### 方法二：手动部署

如果你不想使用Blueprint，也可以手动部署后端服务：

1. 登录Render账号
2. 点击Dashboard中的"New Web Service"按钮
3. 选择包含项目代码的GitHub仓库
4. 配置以下选项：
   - Name: `gomoku-game-backend`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - 添加环境变量：
     - `PORT`: `3001`
     - `NODE_ENV`: `production`
     - `FRONTEND_URL`: `https://你的GitHub用户名.github.io/gomoku-game`
5. 点击"Create Web Service"按钮开始部署
6. 等待部署完成，Render会提供后端服务的URL
7. **记下这个URL，后面需要用到**

### 2. 更新前端配置

在部署前端之前，需要更新前端配置，使其连接到Render上的后端服务：

1. 打开项目根目录下的`.env.production`文件
2. 将`REACT_APP_SERVER_URL`的值设置为Render上的后端服务URL：
   ```
   REACT_APP_SERVER_URL=https://你的后端服务URL.onrender.com
   ```
3. 保存文件并提交到GitHub仓库

### 3. 部署前端到GitHub Pages

1. 确保项目的`package.json`文件中已经配置了正确的`homepage`字段：
   ```json
   "homepage": "https://你的GitHub用户名.github.io/gomoku-game",
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
6. 访问`https://你的GitHub用户名.github.io/gomoku-game`查看部署的前端

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
2. 确保后端服务正常运行
3. 检查浏览器控制台是否有CORS错误
4. 确保后端服务的CORS配置允许来自GitHub Pages的请求

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

当你更新后端代码后，Render会自动检测到变更并重新部署服务。你无需手动触发部署。

## 监控和日志

Render提供了监控和日志功能，你可以在服务详情页面查看：

1. 服务状态和资源使用情况
2. 应用日志
3. 部署历史

## 自定义域名

### GitHub Pages自定义域名

如果你想为GitHub Pages设置自定义域名，可以按照以下步骤操作：

1. 在项目的`public`目录下创建一个名为`CNAME`的文件，内容为你的自定义域名
2. 在你的域名注册商处，将域名的DNS记录指向GitHub Pages
3. 在GitHub仓库的Settings > Pages页面中配置自定义域名

### Render自定义域名

如果你想为Render服务设置自定义域名，可以在Render服务详情页面的"Settings"选项卡中配置。 