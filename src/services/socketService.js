import { io } from 'socket.io-client';

// 根据环境选择服务器URL
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 5000;

const emptyBoard = () => Array(15).fill(null).map(() => Array(15).fill(null));

class SocketService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.piece = null;
    this.callbacks = {};
  }

  // 连接到服务器
  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
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

    this.socket.on('opponentJoined', (data) => {
      console.log('对手加入了游戏');
      if (this.callbacks.onOpponentJoined) {
        this.callbacks.onOpponentJoined(data);
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

    this.socket.on('gameRestarted', (data) => {
      console.log('游戏重新开始');
      if (this.callbacks.onGameRestarted) {
        this.callbacks.onGameRestarted(data);
      }
    });

    this.socket.on('gameDraw', (data) => {
      console.log('游戏平局:', data);
      if (this.callbacks.onGameDraw) {
        this.callbacks.onGameDraw(data);
      }
    });

    this.socket.on('opponentDisconnected', () => {
      console.log('对手离开了游戏');
      if (this.callbacks.onOpponentDisconnected) {
        this.callbacks.onOpponentDisconnected();
      }
    });

    return this.socket;
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
    return this.emitWithAck('createRoom').then((response) => {
      this.roomId = response.roomId;
      this.piece = response.piece;
      return response;
    });
  }

  // 加入游戏房间
  joinRoom(roomId) {
    return this.emitWithAck('joinRoom', roomId.trim().toUpperCase()).then((response) => {
      this.roomId = response.roomId;
      this.piece = response.piece;
      return {
        ...response,
        board: response.board || emptyBoard(),
      };
    });
  }

  // 发送落子信息
  makeMove(row, col) {
    return this.emitWithAck('makeMove', {
      roomId: this.roomId,
      row,
      col,
      color: this.piece === 'B' ? 'black' : 'white',
    });
  }

  // 重新开始游戏
  restartGame() {
    return this.emitWithAck('restartGame', this.roomId);
  }

  emitWithAck(event, payload) {
    const socket = this.connect();

    return new Promise((resolve, reject) => {
      const ack = (error, response) => {
        if (error) {
          reject(new Error('服务器响应超时，请稍后重试'));
          return;
        }

        if (!response || response.ok === false) {
          reject(new Error(response?.error || '请求失败'));
          return;
        }

        resolve(response);
      };

      if (typeof payload === 'undefined') {
        socket.timeout(REQUEST_TIMEOUT).emit(event, ack);
      } else {
        socket.timeout(REQUEST_TIMEOUT).emit(event, payload, ack);
      }
    });
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
