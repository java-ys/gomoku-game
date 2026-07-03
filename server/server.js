const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const BOARD_SIZE = 15;
const COLOR_TO_PIECE = {
  black: 'B',
  white: 'W',
};
const PIECE_TO_COLOR = {
  B: 'black',
  W: 'white',
};
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://java-ys.github.io',
];

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;
const allowedOrigins = buildAllowedOrigins();

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 添加根路径响应
app.get('/', (req, res) => {
  res.status(200).send('Gomoku Game Server is running');
});

// TLS交给Render/Nginx等反向代理终止，应用服务只监听HTTP端口。
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

function buildAllowedOrigins() {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .map(normalizeOrigin)
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function createBoard() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

// 检查获胜
function checkWin(board, row, col, piece) {
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
      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== piece) break;
      count++;
    }
    
    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== piece) break;
      count++;
    }
    
    return count >= 5;
  });
}

// 检查位置是否有效
function isValidPosition(row, col) {
  return Number.isInteger(row) && Number.isInteger(col) &&
    row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isBoardFull(board) {
  return board.every(row => row.every(cell => cell !== null));
}

function createRoomState(ownerId) {
  return {
    players: [
      { id: ownerId, piece: 'B' },
    ],
    board: createBoard(),
    currentTurn: ownerId,
    status: 'waiting',
    lastMove: null,
  };
}

function getPlayer(room, socketId) {
  return room.players.find(player => player.id === socketId);
}

function publicRoomState(roomId, room, extra = {}) {
  return {
    ok: true,
    roomId,
    board: room.board,
    currentTurn: room.currentTurn,
    status: room.status,
    lastMove: room.lastMove,
    ...extra,
  };
}

function fail(socket, callback, message) {
  socket.emit('roomError', message);
  if (typeof callback === 'function') {
    callback({ ok: false, error: message });
  }
}

function validateMove(room, socketId, row, col, color) {
  const player = getPlayer(room, socketId);

  if (!player) {
    return '你不在该房间中';
  }

  if (room.status !== 'playing') {
    return '游戏尚未开始或已经结束';
  }

  if (room.currentTurn !== socketId) {
    return '还没有轮到你';
  }

  if (!isValidPosition(row, col)) {
    return '落子位置无效';
  }

  if (room.board[row][col] !== null) {
    return '该位置已有棋子';
  }

  if (COLOR_TO_PIECE[color] !== player.piece) {
    return '棋子颜色不匹配';
  }

  return null;
}

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  // 创建房间
  socket.on('createRoom', (callback) => {
    const roomId = generateRoomId();
    const room = createRoomState(socket.id);
    rooms.set(roomId, room);
    
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    if (typeof callback === 'function') {
      callback(publicRoomState(roomId, room, { piece: 'B' }));
    }
  });

  // 加入房间
  socket.on('joinRoom', (roomId, callback) => {
    roomId = String(roomId || '').trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) {
      fail(socket, callback, '房间不存在');
      return;
    }
    
    if (room.players.length >= 2) {
      fail(socket, callback, '房间已满');
      return;
    }

    if (getPlayer(room, socket.id)) {
      fail(socket, callback, '你已经在该房间中');
      return;
    }
    
    room.players.push({ id: socket.id, piece: 'W' });
    room.status = 'playing';
    socket.join(roomId);
    const payload = publicRoomState(roomId, room);

    socket.emit('joinedRoom', payload);
    if (typeof callback === 'function') {
      callback({ ...payload, piece: 'W' });
    }
    
    socket.to(roomId).emit('opponentJoined', payload);
  });

  // 处理落子
  socket.on('makeMove', (data, callback) => {
    const { roomId, row, col, color } = data || {};
    const room = rooms.get(roomId);
    
    if (!room) {
      fail(socket, callback, '房间不存在');
      return;
    }

    const validationError = validateMove(room, socket.id, row, col, color);
    if (validationError) {
      fail(socket, callback, validationError);
      return;
    }
    
    const piece = COLOR_TO_PIECE[color];
    room.board[row][col] = piece;
    room.lastMove = { row, col };
    
    if (checkWin(room.board, row, col, piece)) {
      room.status = 'won';
      room.currentTurn = null;
      const payload = publicRoomState(roomId, room, {
        status: 'won',
        winner: PIECE_TO_COLOR[piece],
      });
      if (typeof callback === 'function') {
        callback(payload);
      }
      socket.to(roomId).emit('gameWon', payload);
      return;
    }

    if (isBoardFull(room.board)) {
      room.status = 'draw';
      room.currentTurn = null;
      const payload = publicRoomState(roomId, room, { status: 'draw' });
      if (typeof callback === 'function') {
        callback(payload);
      }
      socket.to(roomId).emit('gameDraw', payload);
      return;
    }

    const nextPlayer = room.players.find(player => player.id !== socket.id);
    room.currentTurn = nextPlayer.id;

    const payload = publicRoomState(roomId, room, { status: 'playing' });
    if (typeof callback === 'function') {
      callback(payload);
    }
    socket.to(roomId).emit('opponentMove', payload);
  });

  // 重新开始游戏
  socket.on('restartGame', (roomId, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      fail(socket, callback, '房间不存在');
      return;
    }

    if (!getPlayer(room, socket.id)) {
      fail(socket, callback, '你不在该房间中');
      return;
    }
    
    room.board = createBoard();
    room.currentTurn = room.players[0].id;
    room.status = room.players.length === 2 ? 'playing' : 'waiting';
    room.lastMove = null;
    
    const payload = publicRoomState(roomId, room);
    if (typeof callback === 'function') {
      callback(payload);
    }
    socket.to(roomId).emit('gameRestarted', payload);
  });

  // 断开连接处理
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    // 清理房间数据
    for (const [roomId, room] of rooms.entries()) {
      if (getPlayer(room, socket.id)) {
        socket.to(roomId).emit('opponentDisconnected');
        rooms.delete(roomId);
      }
    }
  });
});

function startServer() {
  httpServer.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}

// 生成房间ID
function generateRoomId() {
  let roomId;
  do {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.has(roomId));

  return roomId;
}

if (require.main === module) {
  startServer();

  process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('未处理的Promise拒绝:', reason);
  });
}

module.exports = {
  BOARD_SIZE,
  COLOR_TO_PIECE,
  createBoard,
  createRoomState,
  checkWin,
  isBoardFull,
  isValidPosition,
  normalizeOrigin,
  publicRoomState,
  validateMove,
};
