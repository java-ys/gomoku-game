const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://java-ys.github.io',
      'http://localhost:3001',
      'https://212.192.221.50',
      'https://212.192.221.50:3001',
      'http://212.192.221.50',
      'http://212.192.221.50:3001'
    ];
    // 允许来自移动端浏览器的请求（origin可能为null）
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors(corsOptions));

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 添加根路径响应
app.get('/', (req, res) => {
  res.status(200).send('Gomoku Game Server is running');
});

// 创建HTTP服务器
const httpServer = http.createServer(app);

// 配置Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// 游戏房间数据
const rooms = new Map();

// 检查获胜
function checkWin(board, row, col, color) {
  const directions = [
    [1, 0],   // 水平
    [0, 1],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ];
  
  return directions.some(([dx, dy]) => {
    let count = 1;
    
    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== color) break;
      count++;
    }
    
    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== color) break;
      count++;
    }
    
    return count >= 5;
  });
}

// 检查位置是否有效
function isValidPosition(row, col) {
  return row >= 0 && row < 15 && col >= 0 && col < 15;
}

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  // 创建房间
  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      players: [socket.id],
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      currentTurn: socket.id
    });
    
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
  });

  // 加入房间
  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('roomError', '房间不存在');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('roomError', '房间已满');
      return;
    }
    
    room.players.push(socket.id);
    socket.join(roomId);
    socket.emit('joinedRoom', {
      roomId,
      board: room.board,
      currentTurn: room.currentTurn
    });
    
    socket.to(roomId).emit('opponentJoined');
  });

  // 处理落子
  socket.on('makeMove', (data) => {
    const { roomId, row, col, color } = data;
    const room = rooms.get(roomId);
    
    if (!room) return;
    
    room.board[row][col] = color;
    room.currentTurn = room.players.find(id => id !== socket.id);
    
    socket.to(roomId).emit('opponentMove', { row, col, color });
    
    // 检查是否获胜
    if (checkWin(room.board, row, col, color)) {
      io.to(roomId).emit('gameWon', { winner: color });
    }
  });

  // 重新开始游戏
  socket.on('restartGame', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    room.board = Array(15).fill(null).map(() => Array(15).fill(null));
    room.currentTurn = room.players[0];
    
    io.to(roomId).emit('gameRestarted');
  });

  // 断开连接处理
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    // 清理房间数据
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        socket.to(roomId).emit('opponentDisconnected');
        rooms.delete(roomId);
      }
    }
  });
});

// 启动服务器
httpServer.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 生成房间ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
}); 