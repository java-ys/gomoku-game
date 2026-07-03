import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Board from './Board';
import socketService from '../services/socketService';
import './MultiplayerGame.css';

const BOARD_SIZE = 15;

const initializeBoard = () => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

const getSocketId = () => socketService.socket?.id;

const pieceToColor = (piece) => piece === 'B' ? 'black' : 'white';

const MultiplayerGame = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [myPiece, setMyPiece] = useState(null); // 'B' 或 'W'
  const [currentTurn, setCurrentTurn] = useState(null); // socket.id
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting', 'playing', 'player_win', 'opponent_win', 'draw'
  const [lastMove, setLastMove] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [message, setMessage] = useState('等待连接到服务器...');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');
  const [error, setError] = useState('');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const myPieceRef = useRef(myPiece);
  
  const applyRoomState = useCallback((data = {}) => {
    if (data.board) {
      setBoard(data.board);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'currentTurn')) {
      setCurrentTurn(data.currentTurn);
    }

    if (data.lastMove) {
      setLastMove(data.lastMove);
    }
  }, []);

  useEffect(() => {
    myPieceRef.current = myPiece;
  }, [myPiece]);

  const handleConnect = useCallback(() => {
    setMessage('已连接到服务器，等待创建或加入房间...');
    setError('');
  }, []);
  
  const handleDisconnect = useCallback(() => {
    setMessage('与服务器断开连接，请刷新页面重试');
    setGameStatus('waiting');
    setOpponentConnected(false);
    setCurrentTurn(null);
  }, []);
  
  const handleOpponentJoined = useCallback((data = {}) => {
    applyRoomState(data);
    setMessage('对手已加入，游戏开始！');
    setGameStatus('playing');
    setOpponentConnected(true);
  }, [applyRoomState]);
  
  const handleOpponentMove = useCallback((data) => {
    applyRoomState(data);
  }, [applyRoomState]);
  
  const handleGameWon = useCallback((data) => {
    const { winner } = data;
    const myColor = pieceToColor(myPieceRef.current);
    
    applyRoomState(data);

    if (winner === myColor) {
      setGameStatus('player_win');
    } else {
      setGameStatus('opponent_win');
    }
  }, [applyRoomState]);

  const handleGameDraw = useCallback((data) => {
    applyRoomState(data);
    setGameStatus('draw');
  }, [applyRoomState]);
  
  const handleGameRestarted = useCallback((data = {}) => {
    setBoard(initializeBoard());
    setLastMove(null);
    applyRoomState(data);
    setGameStatus('playing');
    setError('');
  }, [applyRoomState]);
  
  const handleOpponentDisconnected = useCallback(() => {
    setMessage('对手已离开游戏');
    setGameStatus('waiting');
    setOpponentConnected(false);
    setCurrentTurn(null);
  }, []);
  
  const handleRoomError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  const handleSocketError = useCallback((errorMessage) => {
    if (socketService.isConnected()) {
      return;
    }

    setError(errorMessage);
    setMessage(errorMessage);
  }, []);
  
  // 初始化Socket连接和事件监听
  useEffect(() => {
    // 注册事件处理函数
    socketService.on('onConnect', handleConnect);
    socketService.on('onDisconnect', handleDisconnect);
    socketService.on('onOpponentJoined', handleOpponentJoined);
    socketService.on('onOpponentMove', handleOpponentMove);
    socketService.on('onGameWon', handleGameWon);
    socketService.on('onGameDraw', handleGameDraw);
    socketService.on('onGameRestarted', handleGameRestarted);
    socketService.on('onOpponentDisconnected', handleOpponentDisconnected);
    socketService.on('onRoomError', handleRoomError);
    socketService.on('onError', handleSocketError);

    // 连接到服务器
    socketService.connect();
    
    // 清理函数
    return () => {
      socketService.disconnect();
    };
  }, [
    handleConnect,
    handleDisconnect,
    handleOpponentJoined,
    handleOpponentMove,
    handleGameWon,
    handleGameDraw,
    handleGameRestarted,
    handleOpponentDisconnected,
    handleRoomError,
    handleSocketError,
  ]);
  
  // 处理玩家点击
  const handleSquareClick = async (row, col) => {
    // 如果游戏未开始、不是玩家回合或格子已有棋子，则忽略点击
    if (
      gameStatus !== 'playing' || 
      currentTurn !== getSocketId() ||
      board[row][col] !== null ||
      isSubmittingMove
    ) {
      return;
    }

    try {
      setError('');
      setIsSubmittingMove(true);
      const response = await socketService.makeMove(row, col);
      applyRoomState(response);

      if (response.status === 'won') {
        handleGameWon(response);
      } else if (response.status === 'draw') {
        handleGameDraw(response);
      }
    } catch (err) {
      setError(err.message || '落子失败');
    } finally {
      setIsSubmittingMove(false);
    }
  };
  
  // 创建房间
  const createRoom = async () => {
    try {
      setError('');
      const response = await socketService.createRoom();
      const { roomId, piece } = response;
      
      applyRoomState(response);
      setRoomId(roomId);
      setMyPiece(piece);
      setGameStatus('waiting');
      setOpponentConnected(false);
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
      const response = await socketService.joinRoom(roomIdToJoin);
      const { roomId, piece } = response;
      
      applyRoomState(response);
      setRoomId(roomId);
      setMyPiece(piece);
      setGameStatus('playing');
      setMessage('已加入房间，游戏开始！');
      setOpponentConnected(true);
    } catch (err) {
      setError(err.message || '加入房间失败');
    }
  };
  
  // 重新开始游戏
  const restartGame = async () => {
    try {
      setError('');
      const response = await socketService.restartGame();
      handleGameRestarted(response);
    } catch (err) {
      setError(err.message || '重新开始失败');
    }
  };
  
  // 游戏状态信息
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting':
        return message;
      case 'playing':
        if (isSubmittingMove) {
          return '正在落子...';
        }
        return currentTurn === getSocketId()
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
