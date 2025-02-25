const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// 验证CORS来源的函数
const corsOriginValidator = (origin, callback) => {
  // 开发环境允许所有来源
  if (!origin || process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  
  // 允许的来源列表
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://java-ys.github.io',
    'https://gitee.io'
  ];
  
  // 检查是否是GitHub Pages域名或Gitee Pages域名
  const isGitHubPages = origin.match(/^https:\/\/[\w-]+\.github\.io$/);
  const isGiteePages = origin.match(/^https:\/\/[\w-]+\.gitee\.io$/);
  
  if (allowedOrigins.includes(origin) || isGitHubPages || isGiteePages) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

const app = express();
app.use(cors({
  origin: corsOriginValidator,
  methods: ['GET', 'POST'],
  credentials: true
}));

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 添加根路径响应
app.get('/', (req, res) => {
  res.status(200).send('Gomoku Game Server is running');
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 存储游戏房间信息
const rooms = {};

// 检查是否有五子连珠
const checkWin = (board, row, col, color) => {
  const directions = [
    [1, 0],   // 水平
    [0, 1],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1;
    const winningLine = [{ row, col }];
    
    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      
      if (
        newRow >= 0 && newRow < 15 &&
        newCol >= 0 && newCol < 15 &&
        board[newRow][newCol] === color
      ) {
        count++;
        winningLine.push({ row: newRow, col: newCol });
      } else {
        break;
      }
    }
    
    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      
      if (
        newRow >= 0 && newRow < 15 &&
        newCol >= 0 && newCol < 15 &&
        board[newRow][newCol] === color
      ) {
        count++;
        winningLine.push({ row: newRow, col: newCol });
      } else {
        break;
      }
    }
    
    if (count >= 5) {
      return { winner: color, winningLine };
    }
  }
  
  return null;
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // 创建房间
  socket.on('createRoom', () => {
    const roomId = uuidv4().substring(0, 8);
    
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, color: 'black' }],
      board: Array(15).fill().map(() => Array(15).fill(null)),
      currentPlayer: 'black',
      gameStarted: false
    };
    
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    
    console.log(`Room created: ${roomId}`);
  });
  
  // 加入房间
  socket.on('joinRoom', (roomId) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('roomError', '房间不存在');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('roomError', '房间已满');
      return;
    }
    
    // 分配颜色（与第一个玩家相反）
    const color = room.players[0].color === 'black' ? 'white' : 'black';
    
    room.players.push({ id: socket.id, color });
    room.gameStarted = true;
    
    socket.join(roomId);
    socket.emit('joinedRoom', { roomId, color });
    
    // 通知房间中的其他玩家
    socket.to(roomId).emit('opponentJoined');
    
    console.log(`Player ${socket.id} joined room ${roomId}`);
  });
  
  // 处理玩家移动
  socket.on('makeMove', ({ roomId, row, col, color }) => {
    const room = rooms[roomId];
    
    if (!room) return;
    
    // 更新棋盘
    room.board[row][col] = color;
    room.currentPlayer = color === 'black' ? 'white' : 'black';
    
    // 通知对手
    socket.to(roomId).emit('opponentMove', { row, col, color });
    
    // 检查是否获胜
    const winResult = checkWin(room.board, row, col, color);
    if (winResult) {
      io.to(roomId).emit('gameWon', winResult);
    }
  });
  
  // 重新开始游戏
  socket.on('restartGame', (roomId) => {
    const room = rooms[roomId];
    
    if (!room) return;
    
    room.board = Array(15).fill().map(() => Array(15).fill(null));
    room.currentPlayer = 'black';
    
    io.to(roomId).emit('gameRestarted');
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // 查找玩家所在的房间
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(player => player.id === socket.id);
      
      if (playerIndex !== -1) {
        // 通知房间中的其他玩家
        socket.to(roomId).emit('opponentDisconnected');
        
        // 如果房间中没有其他玩家，删除房间
        if (room.players.length <= 1) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted`);
        } else {
          // 从房间中移除玩家
          room.players.splice(playerIndex, 1);
        }
        
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 