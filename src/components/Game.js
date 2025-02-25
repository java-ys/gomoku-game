import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Board from './Board';
import { checkWin, makeAiMove } from '../utils/aiLogic';
import './Game.css';

const Game = () => {
  const BOARD_SIZE = 15;
  const PLAYER = 'B'; // 黑子
  const AI = 'W';     // 白子
  
  // 初始化空棋盘
  const initializeBoard = () => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  };
  
  const [board, setBoard] = useState(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER); // 玩家先手
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'player_win', 'ai_win', 'draw'
  const [lastMove, setLastMove] = useState(null);
  
  // 处理玩家点击
  const handleSquareClick = (row, col) => {
    // 如果游戏已结束或不是玩家回合，则忽略点击
    if (gameStatus !== 'playing' || currentPlayer !== PLAYER || board[row][col] !== null) {
      return;
    }
    
    // 更新棋盘
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = PLAYER;
    setBoard(newBoard);
    setLastMove({ row, col });
    
    // 检查玩家是否获胜
    if (checkWin(newBoard, row, col, PLAYER)) {
      setGameStatus('player_win');
      return;
    }
    
    // 检查是否平局
    if (newBoard.every(row => row.every(cell => cell !== null))) {
      setGameStatus('draw');
      return;
    }
    
    // 切换到AI回合
    setCurrentPlayer(AI);
  };
  
  // AI回合
  useEffect(() => {
    if (currentPlayer === AI && gameStatus === 'playing') {
      // 减少延迟时间，让AI反应更快
      const aiTimer = setTimeout(() => {
        const move = makeAiMove(board, AI);
        
        if (move) {
          const { row, col } = move;
          const newBoard = board.map(r => [...r]);
          newBoard[row][col] = AI;
          setBoard(newBoard);
          setLastMove({ row, col });
          
          // 检查AI是否获胜
          if (checkWin(newBoard, row, col, AI)) {
            setGameStatus('ai_win');
            return;
          }
          
          // 检查是否平局
          if (newBoard.every(row => row.every(cell => cell !== null))) {
            setGameStatus('draw');
            return;
          }
          
          // 切换回玩家回合
          setCurrentPlayer(PLAYER);
        }
      }, 100); // 将延迟从500ms减少到100ms
      
      return () => clearTimeout(aiTimer);
    }
  }, [currentPlayer, board, gameStatus]);
  
  // 重新开始游戏
  const resetGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer(PLAYER);
    setGameStatus('playing');
    setLastMove(null);
  };
  
  // 游戏状态信息
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'player_win':
        return '恭喜！你赢了！';
      case 'ai_win':
        return '电脑赢了！再接再厉！';
      case 'draw':
        return '平局！';
      default:
        return currentPlayer === PLAYER ? '你的回合（黑子）' : '电脑思考中...（白子）';
    }
  };
  
  return (
    <div className="game-container">
      <h2>与AI对战</h2>
      
      <Link to="/" className="back-link">返回主页</Link>
      
      <div className="game-status">{getStatusMessage()}</div>
      
      <div className="game-board">
        <Board board={board} lastMove={lastMove} onClick={handleSquareClick} />
      </div>
      
      <button className="reset-button" onClick={resetGame}>
        重新开始
      </button>
    </div>
  );
};

export default Game; 