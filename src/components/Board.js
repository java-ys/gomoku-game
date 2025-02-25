import React from 'react';
import Square from './Square';

const Board = ({ board, lastMove, onClick }) => {
  const CELL_SIZE = 30;
  const BOARD_SIZE = board.length;
  const PADDING = 20; // 增加内边距使棋盘更美观
  
  const boardContainerStyle = {
    position: 'relative',
    width: `${CELL_SIZE * (BOARD_SIZE - 1) + 2 * PADDING}px`,
    height: `${CELL_SIZE * (BOARD_SIZE - 1) + 2 * PADDING}px`,
    backgroundColor: '#e6c88c',
    border: '2px solid #8c6e3c',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  // 内部棋盘容器样式
  const innerBoardStyle = {
    position: 'relative',
    width: `${CELL_SIZE * (BOARD_SIZE - 1)}px`,
    height: `${CELL_SIZE * (BOARD_SIZE - 1)}px`,
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
        top: `${index * CELL_SIZE}px`,
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
        left: `${index * CELL_SIZE}px`,
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
    gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
    gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
    gridColumnGap: '0px',
    gridRowGap: '0px',
    transform: `translate(-${CELL_SIZE / 2}px, -${CELL_SIZE / 2}px)`,
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
    <div style={boardContainerStyle}>
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Board; 