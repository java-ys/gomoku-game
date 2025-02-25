import React, { useState, useEffect } from 'react';
import Board from './Board';
import socketService from '../services/socketService';
// eslint-disable-next-line no-unused-vars
import { checkWin } from '../utils/aiLogic';

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
    const { winner, winningLine } = data;
    const isMyWin = (winner === 'black' && myPiece === 'B') || (winner === 'white' && myPiece === 'W');
    
    setGameStatus(isMyWin ? 'player_win' : 'opponent_win');
    setMessage(isMyWin ? '恭喜！你赢了！' : '对手赢了！再接再厉！');
  };
  
  // 处理游戏重新开始
  const handleGameRestarted = () => {
    setBoard(initializeBoard());
    setCurrentTurn(myPiece === 'B' ? socketService.socket.id : null);
    setGameStatus('playing');
    setLastMove(null);
    setMessage('游戏已重新开始！');
  };
  
  // 处理对手离开
  const handleOpponentDisconnected = () => {
    setMessage('对手已离开游戏，等待新对手加入...');
    setGameStatus('waiting');
    setOpponentConnected(false);
  };
  
  // 处理房间错误
  const handleRoomError = (errorMessage) => {
    setMessage(`错误: ${errorMessage}`);
  };
  
  // 连接到服务器
  useEffect(() => {
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
    
    return () => {
      socketService.disconnect();
    };
  }, []);
  
  // 处理玩家点击
  const handleSquareClick = (row, col) => {
    // 如果游戏未开始、已结束、不是玩家回合或位置已有棋子，则忽略点击
    if (
      gameStatus !== 'playing' || 
      socketService.socket.id !== currentTurn || 
      board[row][col] !== null
    ) {
      return;
    }
    
    // 更新本地棋盘
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = myPiece;
    setBoard(newBoard);
    setLastMove({ row, col });
    
    // 更新当前回合
    setCurrentTurn(null);
    
    // 发送落子信息到服务器
    socketService.makeMove(row, col);
  };
  
  // 创建房间
  const createRoom = async () => {
    try {
      setMessage('正在创建房间...');
      const response = await socketService.createRoom();
      setRoomId(response.roomId);
      setMyPiece(response.piece);
      setCurrentTurn(response.currentTurn);
      setMessage(`房间已创建，ID: ${response.roomId}，等待对手加入...`);
    } catch (error) {
      setMessage(`创建房间失败: ${error.message}`);
    }
  };
  
  // 加入房间
  const joinRoom = async (roomIdToJoin) => {
    if (!roomIdToJoin) {
      setMessage('请输入有效的房间ID');
      return;
    }
    
    try {
      setMessage('正在加入房间...');
      const response = await socketService.joinRoom(roomIdToJoin);
      setRoomId(roomIdToJoin);
      setMyPiece(response.piece);
      setCurrentTurn(response.currentTurn);
      setBoard(response.board);
      setGameStatus('playing');
      setOpponentConnected(true);
      setMessage('已加入房间，游戏开始！');
    } catch (error) {
      setMessage(`加入房间失败: ${error.message}`);
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
        return currentTurn === socketService.socket?.id 
          ? `你的回合（${myPiece === 'B' ? '黑子' : '白子'}）` 
          : `对手回合（${myPiece === 'B' ? '白子' : '黑子'}）`;
      case 'player_win':
        return '恭喜！你赢了！';
      case 'opponent_win':
        return '对手赢了！再接再厉！';
      case 'draw':
        return '平局！';
      default:
        return message;
    }
  };
  
  // 房间加入表单
  const [inputRoomId, setInputRoomId] = useState('');
  
  const gameContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  };
  
  const statusStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: gameStatus !== 'playing' && gameStatus !== 'waiting' ? '#d32f2f' : '#333',
  };
  
  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    margin: '0 10px',
  };
  
  const inputStyle = {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginRight: '10px',
  };
  
  const roomInfoStyle = {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center',
  };
  
  return (
    <div style={gameContainerStyle}>
      <div style={statusStyle}>{getStatusMessage()}</div>
      
      {roomId && (
        <div style={roomInfoStyle}>
          <p>房间ID: <strong>{roomId}</strong></p>
          <p>你的棋子: <strong>{myPiece === 'B' ? '黑子' : '白子'}</strong></p>
        </div>
      )}
      
      {!roomId && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={buttonStyle} onClick={createRoom}>
            创建新房间
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="输入房间ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              style={inputStyle}
            />
            <button style={buttonStyle} onClick={() => joinRoom(inputRoomId)}>
              加入房间
            </button>
          </div>
        </div>
      )}
      
      <Board board={board} lastMove={lastMove} onClick={handleSquareClick} />
      
      {(gameStatus === 'player_win' || gameStatus === 'opponent_win' || gameStatus === 'draw') && (
        <button style={buttonStyle} onClick={restartGame}>
          重新开始
        </button>
      )}
    </div>
  );
};

export default MultiplayerGame; 