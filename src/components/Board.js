import React, { useState, useEffect } from 'react';
import Square from './Square';
import './Board.css'; // 添加CSS文件引用

const Board = ({ board, lastMove, onClick }) => {
  const BOARD_SIZE = board.length;
  const [cellSize, setCellSize] = useState(30); // 默认单元格大小
  const [padding, setPadding] = useState(20); // 默认内边距
  
  // 根据窗口大小调整棋盘尺寸
  useEffect(() => {
    const handleResize = () => {
      // 获取视口宽度
      const viewportWidth = Math.min(window.innerWidth, 800); // 最大宽度800px
      
      // 计算合适的单元格大小和内边距
      // 为了确保棋盘在小屏幕上完全可见，我们根据屏幕宽度动态调整
      const availableWidth = viewportWidth - 40; // 减去页面边距
      const newCellSize = Math.max(Math.floor(availableWidth / (BOARD_SIZE + 1)), 15); // 最小15px
      const newPadding = Math.max(Math.floor(newCellSize / 2), 10); // 最小10px
      
      setCellSize(newCellSize);
      setPadding(newPadding);
    };
    
    // 初始调整
    handleResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return () => window.removeEventListener('resize', handleResize);
  }, [BOARD_SIZE]);
  
  const boardContainerStyle = {
    position: 'relative',
    width: `${cellSize * (BOARD_SIZE - 1) + 2 * padding}px`,
    height: `${cellSize * (BOARD_SIZE - 1) + 2 * padding}px`,
    backgroundColor: '#e6c88c',
    border: '2px solid #8c6e3c',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto', // 居中显示
    maxWidth: '100%', // 确保不超出容器
  };

  // 内部棋盘容器样式
  const innerBoardStyle = {
    position: 'relative',
    width: `${cellSize * (BOARD_SIZE - 1)}px`,
    height: `${cellSize * (BOARD_SIZE - 1)}px`,
  };

  // 绘制网格线的样式
  const gridLinesStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none', // 确保点击事件可以穿透到下面的棋子
  };

  // 创建水平线
  const horizontalLines = Array(BOARD_SIZE).fill(null).map((_, index) => (
    <div
      key={`h-${index}`}
      style={{
        position: 'absolute',
        left: '0',
        top: `${index * cellSize}px`,
        width: '100%',
        height: '1px',
        backgroundColor: '#000',
      }}
    />
  ));

  // 创建垂直线
  const verticalLines = Array(BOARD_SIZE).fill(null).map((_, index) => (
    <div
      key={`v-${index}`}
      style={{
        position: 'absolute',
        top: '0',
        left: `${index * cellSize}px`,
        width: '1px',
        height: '100%',
        backgroundColor: '#000',
      }}
    />
  ));

  // 棋子容器样式
  const piecesContainerStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
    gridColumnGap: '0px',
    gridRowGap: '0px',
    transform: `translate(-${cellSize / 2}px, -${cellSize / 2}px)`,
  };

  // 添加红色边框样式
  const redBorderStyle = {
    position: 'absolute',
    top: '-4px',
    left: '-4px',
    right: '-4px',
    bottom: '-4px',
    border: '4px solid #d32f2f',
    pointerEvents: 'none',
  };

  return (
    <div className="board-wrapper">
      <div style={boardContainerStyle} className="board-container">
        {/* 红色边框 */}
        <div style={redBorderStyle}></div>
        
        {/* 内部棋盘 */}
        <div style={innerBoardStyle}>
          {/* 绘制网格线 */}
          <div style={gridLinesStyle}>
            {horizontalLines}
            {verticalLines}
          </div>
          
          {/* 放置棋子 */}
          <div style={piecesContainerStyle}>
            {board.map((row, rowIndex) => 
              row.map((cell, colIndex) => (
                <Square 
                  key={`${rowIndex}-${colIndex}`}
                  row={rowIndex}
                  col={colIndex}
                  value={cell}
                  isLastMove={lastMove && lastMove.row === rowIndex && lastMove.col === colIndex}
                  onClick={onClick}
                  cellSize={cellSize}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board; 