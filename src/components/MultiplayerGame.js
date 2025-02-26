import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Board from './Board';
import socketService from '../services/socketService';
// eslint-disable-next-line no-unused-vars
import { checkWin } from '../utils/aiLogic';
import './MultiplayerGame.css';

const MultiplayerGame = () => {
  const BOARD_SIZE = 15;
  
  // 初始化空棋盘
  const initializeBoard = () => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  };
  
  const [board, setBoard] = useState(initializeBoard());
  const [myPiece, setMyPiece] = useState(null); // 'B' 或 'W'
  const [currentTurn, setCurrentTurn] = useState(null); // socket.id
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting', 'playing', 'player_win', 'opponent_win', 'draw'
  const [lastMove, setLastMove] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [message, setMessage] = useState('等待连接到服务器...');
  // eslint-disable-next-line no-unused-vars
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');
  const [error, setError] = useState('');
  
  // 处理连接成功
  const handleConnect = () => {
    setMessage('已连接到服务器，等待创建或加入房间...');
  };
  
  // 处理断开连接
  const handleDisconnect = () => {
    setMessage('与服务器断开连接，请刷新页面重试');
    setGameStatus('waiting');
    setOpponentConnected(false);
  };
  
  // 处理对手加入
  const handleOpponentJoined = () => {
    setMessage('对手已加入，游戏开始！');
    setGameStatus('playing');
    setOpponentConnected(true);
  };
  
  // 处理对手移动
  const handleOpponentMove = (data) => {
    const { row, col, color } = data;
    
    // 更新棋盘
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => [...r]);
      newBoard[row][col] = color === 'black' ? 'B' : 'W';
      return newBoard;
    });
    setLastMove({ row, col });
    
    // 更新当前回合
    setCurrentTurn(socketService.socket.id);
  };
  
  // 处理游戏胜利
  const handleGameWon = (data) => {
    // eslint-disable-next-line no-unused-vars
    const { winner, winningLine } = data;
    
    if (winner === (myPiece === 'B' ? 'black' : 'white')) {
      setGameStatus('player_win');
    } else {
      setGameStatus('opponent_win');
    }
  };
  
  // 处理游戏重新开始
  const handleGameRestarted = () => {
    setBoard(initializeBoard());
    setLastMove(null);
    setGameStatus('playing');
    
    // 黑子先行
    if (myPiece === 'B') {
      setCurrentTurn(socketService.socket.id);
    } else {
      setCurrentTurn(null);
    }
  };
  
  // 处理对手断开连接
  const handleOpponentDisconnected = () => {
    setMessage('对手已离开游戏');
    setGameStatus('waiting');
    setOpponentConnected(false);
  };
  
  // 处理房间错误
  const handleRoomError = (errorMessage) => {
    setError(errorMessage);
  };
  
  // 初始化Socket连接和事件监听
  useEffect(() => {
    // 连接到服务器
    socketService.connect();
    
    // 注册事件处理函数
    socketService.on('onConnect', handleConnect);
    socketService.on('onDisconnect', handleDisconnect);
    socketService.on('onOpponentJoined', handleOpponentJoined);
    socketService.on('onOpponentMove', handleOpponentMove);
    socketService.on('onGameWon', handleGameWon);
    socketService.on('onGameRestarted', handleGameRestarted);
    socketService.on('onOpponentDisconnected', handleOpponentDisconnected);
    socketService.on('onRoomError', handleRoomError);
    
    // 清理函数
    return () => {
      socketService.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 处理玩家点击
  const handleSquareClick = (row, col) => {
    // 如果游戏未开始、不是玩家回合或格子已有棋子，则忽略点击
    if (
      gameStatus !== 'playing' || 
      currentTurn !== socketService.socket.id || 
      board[row][col] !== null
    ) {
      return;
    }
    
    // 更新棋盘
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = myPiece;
    setBoard(newBoard);
    setLastMove({ row, col });
    
    // 发送移动信息到服务器
    socketService.makeMove(row, col);
    
    // 更新当前回合
    setCurrentTurn(null);
  };
  
  // 创建房间
  const createRoom = async () => {
    try {
      setError('');
      const { roomId, piece } = await socketService.createRoom();
      
      setRoomId(roomId);
      setMyPiece(piece);
      setCurrentTurn(socketService.socket.id); // 创建者先行
      setMessage(`已创建房间，房间ID: ${roomId}，等待对手加入...`);
    } catch (err) {
      setError(err.message || '创建房间失败');
    }
  };
  
  // 加入房间
  const joinRoom = async (roomIdToJoin) => {
    if (!roomIdToJoin) {
      setError('请输入房间ID');
      return;
    }
    
    try {
      setError('');
      const { roomId, piece } = await socketService.joinRoom(roomIdToJoin);
      
      setRoomId(roomId);
      setMyPiece(piece);
      setGameStatus('playing');
      setMessage('已加入房间，游戏开始！');
      setOpponentConnected(true);
      
      // 白子后行
      if (piece === 'W') {
        setCurrentTurn(null);
      } else {
        setCurrentTurn(socketService.socket.id);
      }
    } catch (err) {
      setError(err.message || '加入房间失败');
    }
  };
  
  // 重新开始游戏
  const restartGame = () => {
    socketService.restartGame();
  };
  
  // 游戏状态信息
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting':
        return message;
      case 'playing':
        return currentTurn === socketService.socket.id 
          ? '你的回合' 
          : '等待对手落子';
      case 'player_win':
        return '恭喜！你赢了！';
      case 'opponent_win':
        return '对手赢了！再接再厉！';
      case 'draw':
        return '平局！';
      default:
        return '等待连接...';
    }
  };
  
  return (
    <div className="multiplayer-game">
      <h2>多人对战</h2>
      
      <Link to="/" className="back-link">返回主页</Link>
      
      <div className={`game-status ${gameStatus === 'player_win' ? 'winner' : ''}`}>
        {getStatusMessage()}
      </div>
      
      {roomId && (
        <div className="room-info">
          <h3>房间信息</h3>
          <p>房间ID: <strong>{roomId}</strong></p>
          <p>你的棋子: <strong>{myPiece === 'B' ? '黑子' : '白子'}</strong></p>
          {!opponentConnected && <p className="waiting-message">等待对手加入...</p>}
        </div>
      )}
      
      {!roomId && (
        <div className="room-setup">
          <div className="room-actions">
            <button className="create-room-btn" onClick={createRoom}>
              创建新房间
            </button>
            
            <div className="join-room">
              <input
                type="text"
                placeholder="输入房间ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
              />
              <button onClick={() => joinRoom(inputRoomId)}>
                加入房间
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}
      
      <div className="game-board">
        <Board board={board} lastMove={lastMove} onClick={handleSquareClick} />
      </div>
      
      {(gameStatus === 'player_win' || gameStatus === 'opponent_win' || gameStatus === 'draw') && (
        <button className="restart-btn" onClick={restartGame}>
          重新开始
        </button>
      )}
    </div>
  );
};

export default MultiplayerGame; 