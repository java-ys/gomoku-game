# 五子棋游戏 (Gomoku)

这是一个使用React实现的五子棋（Gomoku）游戏，支持人机对战和双人在线对战。

## 在线体验

游戏已部署到GitHub Pages，可以通过以下链接访问：
[https://java-ys.github.io/gomoku-game](https://java-ys.github.io/gomoku-game)

后端服务已部署到Render，为多人游戏提供支持：
[https://gomoku-game-backend.onrender.com](https://gomoku-game-backend.onrender.com)

## 功能特点

1. 15×15 的标准棋盘
2. 两种游戏模式：
   - **人机对战**：玩家使用黑子，电脑使用白子
   - **双人对战**：创建或加入房间，与朋友实时对战
3. 玩家先手，点击棋盘上的交叉点可以落子
4. 电脑AI会分析局面并做出决策
5. 自动判断胜负，五子连珠获胜
6. 最后落子位置会用红色高亮显示
7. 游戏结束后显示胜负结果
8. 可以点击"重新开始"按钮重置游戏
9. 在线多人游戏房间系统，可以创建和加入房间

## 技术实现

- 前端框架：React
- 状态管理：React Hooks (useState, useEffect)
- 路由管理：React Router
- 实时通信：Socket.IO
- AI算法：评分系统，包括：
  - 寻找能形成五连的位置
  - 阻止玩家形成五连
  - 评估各种棋型（活四、冲四、活三等）并给予权重
  - 优化的搜索范围，只考虑已有棋子周围的空位
  - 快速响应机制，AI思考时间仅为100ms

## 如何使用

### 客户端
1. 克隆此仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm start`
4. 在浏览器中打开 `http://localhost:3000`

### 服务器端（用于多人游戏）
1. 进入服务器目录：`cd server`
2. 安装依赖：`npm install`
3. 启动服务器：`npm start`
4. 服务器将在 `http://localhost:3001` 运行

## 多人游戏使用方法

1. 在主页选择"双人对战"模式
2. 创建新房间或加入已有房间：
   - 创建房间：点击"创建新房间"按钮，系统会生成一个房间ID
   - 加入房间：输入房间ID，点击"加入房间"按钮
3. 将房间ID分享给朋友，邀请他们加入
4. 创建者使用黑子先行，加入者使用白子
5. 游戏结束后可以点击"重新开始"按钮进行新一局游戏

## 部署方法

### 部署架构

本项目采用以下部署架构：
- 前端：部署到GitHub Pages，提供静态资源服务
- 后端：部署到自有服务器，提供WebSocket服务和游戏逻辑

### 部署到GitHub Pages

1. 构建生产版本：`npm run build`
2. 部署到GitHub Pages：`npm run deploy`

### 部署到自有服务器

我们提供了自有服务器部署脚本，可以轻松部署后端服务：

1. 将代码推送到GitHub仓库
2. 在服务器上运行部署脚本：
   ```bash
   chmod +x server-deploy.sh
   ./server-deploy.sh
   ```
3. 脚本会自动安装依赖、配置环境变量、启动服务并配置防火墙

详细的部署步骤请参考[SERVER_DEPLOY.md](./SERVER_DEPLOY.md)文件。

### 国内部署方案

对于需要在国内部署的用户，我们提供了以下部署方案：

- 前端：部署到Gitee Pages，提供静态资源服务
- 后端：部署到腾讯云轻量应用服务器，提供WebSocket服务和游戏逻辑

#### 部署到Gitee Pages

1. 在Gitee上创建仓库并推送代码
2. 修改`package.json`中的`homepage`字段
3. 构建生产版本并开启Gitee Pages服务

#### 部署到腾讯云轻量应用服务器

1. 购买腾讯云轻量应用服务器
2. 上传后端代码并安装依赖
3. 使用PM2启动服务并配置防火墙

详细的国内部署步骤请参考[CHINA_DEPLOY.md](./CHINA_DEPLOY.md)文件。

## 游戏规则

- 黑方先行
- 在15×15的棋盘上，任意一方先在横、竖或斜方向上形成不间断的五子连线即为获胜
- 没有禁手规则（如三三禁手、四四禁手等）

## 项目结构

```
gomoku-game/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/
│   │   ├── Board.js       # 棋盘组件
│   │   ├── Game.js        # 人机对战游戏组件
│   │   ├── Home.js        # 主页组件
│   │   ├── MultiplayerGame.js # 多人游戏组件
│   │   └── Square.js      # 棋盘格子组件
│   ├── services/
│   │   └── socketService.js # Socket通信服务
│   ├── utils/
│   │   └── aiLogic.js     # AI决策逻辑
│   ├── App.js
│   ├── index.js
│   └── ...
├── server/
│   ├── server.js          # 多人游戏服务器
│   └── package.json       # 服务器依赖
└── package.json           # 客户端依赖
```

## 最近优化

- AI响应速度提升：将AI思考时间从500ms减少到100ms
- 搜索效率提高：AI只考虑已有棋子周围的空位，而不是遍历整个棋盘
- 评估算法优化：改进了棋型评分系统，使AI更具智能性
- 决策逻辑增强：优先检测直接获胜的位置和阻止玩家获胜的位置
- 新增双人对战功能：支持创建和加入房间，与朋友实时对战

## 未来改进计划

- 增加难度级别选择
- 添加悔棋功能
- 实现对战记录保存
- 进一步优化AI算法
- 添加游戏聊天功能
- 支持观战模式 