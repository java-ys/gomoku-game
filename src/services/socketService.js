import { io } from 'socket.io-client';

// 根据环境选择服务器URL
const SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'https://212.192.221.50:3001'  // 生产环境使用用户自己的服务器
  : 'http://localhost:3001';  // 开发环境使用本地服务器

class SocketService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.piece = null;
    this.callbacks = {};
  }

  // 连接到服务器
  connect() {
    if (this.socket) return;

    // 添加Socket.IO连接选项
    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],  // 优先使用WebSocket
      secure: true,  // 启用安全连接
      rejectUnauthorized: false,  // 允许自签名证书
      withCredentials: true,  // 允许跨域携带凭证
    });
    
    // 添加连接错误处理
    this.socket.on('connect_error', (error) => {
      console.error('连接错误:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('连接服务器失败，请检查网络连接');
      }
    });

    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    });

    this.socket.on('roomCreated', (roomId) => {
      console.log('房间已创建:', roomId);
      if (this.callbacks.onRoomCreated) {
        this.callbacks.onRoomCreated(roomId);
      }
    });

    this.socket.on('joinedRoom', (data) => {
      console.log('已加入房间:', data);
      if (this.callbacks.onJoinedRoom) {
        this.callbacks.onJoinedRoom(data);
      }
    });

    this.socket.on('roomError', (errorMessage) => {
      console.error('房间错误:', errorMessage);
      if (this.callbacks.onRoomError) {
        this.callbacks.onRoomError(errorMessage);
      }
    });

    this.socket.on('opponentJoined', () => {
      console.log('对手加入了游戏');
      if (this.callbacks.onOpponentJoined) {
        this.callbacks.onOpponentJoined();
      }
    });

    this.socket.on('opponentMove', (data) => {
      console.log('收到对手落子信息', data);
      if (this.callbacks.onOpponentMove) {
        this.callbacks.onOpponentMove(data);
      }
    });

    this.socket.on('gameWon', (data) => {
      console.log('游戏结束，获胜者:', data);
      if (this.callbacks.onGameWon) {
        this.callbacks.onGameWon(data);
      }
    });

    this.socket.on('gameRestarted', () => {
      console.log('游戏重新开始');
      if (this.callbacks.onGameRestarted) {
        this.callbacks.onGameRestarted();
      }
    });

    this.socket.on('opponentDisconnected', () => {
      console.log('对手离开了游戏');
      if (this.callbacks.onOpponentDisconnected) {
        this.callbacks.onOpponentDisconnected();
      }
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
      this.piece = null;
    }
  }

  // 创建游戏房间
  createRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect();
      }

      // 设置一次性监听器来处理房间创建响应
      this.socket.once('roomCreated', (roomId) => {
        this.roomId = roomId;
        this.piece = 'B'; // 创建者使用黑子
        resolve({
          roomId,
          piece: 'B',
          currentTurn: this.socket.id
        });
      });

      // 设置一次性监听器来处理错误
      this.socket.once('roomError', (errorMessage) => {
        reject(new Error(errorMessage || '创建房间失败'));
      });

      // 发送创建房间请求
      this.socket.emit('createRoom');
    });
  }

  // 加入游戏房间
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect();
      }

      // 设置一次性监听器来处理加入房间响应
      this.socket.once('joinedRoom', (data) => {
        this.roomId = roomId;
        this.piece = 'W'; // 加入者使用白子
        resolve({
          roomId,
          piece: 'W',
          currentTurn: data.currentTurn || null,
          board: data.board || Array(15).fill(null).map(() => Array(15).fill(null))
        });
      });

      // 设置一次性监听器来处理错误
      this.socket.once('roomError', (errorMessage) => {
        reject(new Error(errorMessage || '加入房间失败'));
      });

      // 发送加入房间请求
      this.socket.emit('joinRoom', roomId);
    });
  }

  // 发送落子信息
  makeMove(row, col) {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('makeMove', {
      roomId: this.roomId,
      row,
      col,
      color: this.piece === 'B' ? 'black' : 'white'
    });
  }

  // 重新开始游戏
  restartGame() {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('restartGame', this.roomId);
  }

  // 注册回调函数
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // 获取当前玩家的棋子颜色
  getPiece() {
    return this.piece;
  }

  // 获取房间ID
  getRoomId() {
    return this.roomId;
  }

  // 检查是否已连接
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// 创建单例实例
const socketService = new SocketService();

export default socketService; 