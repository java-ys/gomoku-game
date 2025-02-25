import React from 'react';

const Square = ({ row, col, value, isLastMove, onClick }) => {
  const squareStyle = {
    position: 'relative',
    width: '30px',
    height: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: value ? 'default' : 'pointer',
  };

  const pieceStyle = value ? {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: value === 'B' ? '#000' : '#fff',
    border: value === 'W' ? '1px solid #000' : 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    zIndex: 1,
  } : null;

  const highlightStyle = isLastMove ? {
    position: 'absolute',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#f00',
    zIndex: 2,
  } : null;

  return (
    <div 
      className="square" 
      style={squareStyle} 
      onClick={() => !value && onClick(row, col)}
    >
      {value && <div style={pieceStyle}></div>}
      {isLastMove && <div style={highlightStyle}></div>}
    </div>
  );
};

export default Square; 