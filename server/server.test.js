const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBoard,
  createRoomState,
  checkWin,
  isBoardFull,
  isValidPosition,
  normalizeOrigin,
  validateMove,
} = require('./server');

test('checkWin detects five connected pieces horizontally and diagonally', () => {
  const board = createBoard();

  for (let col = 2; col < 7; col++) {
    board[3][col] = 'B';
  }

  assert.equal(checkWin(board, 3, 4, 'B'), true);
  assert.equal(checkWin(board, 3, 4, 'W'), false);

  const diagonalBoard = createBoard();
  for (let index = 0; index < 5; index++) {
    diagonalBoard[index + 1][index + 1] = 'W';
  }

  assert.equal(checkWin(diagonalBoard, 3, 3, 'W'), true);
});

test('validateMove rejects invalid multiplayer moves', () => {
  const room = createRoomState('black-player');
  room.players.push({ id: 'white-player', piece: 'W' });
  room.status = 'playing';

  assert.equal(validateMove(room, 'spectator', 7, 7, 'black'), '你不在该房间中');
  assert.equal(validateMove(room, 'white-player', 7, 7, 'white'), '还没有轮到你');
  assert.equal(validateMove(room, 'black-player', -1, 7, 'black'), '落子位置无效');
  assert.equal(validateMove(room, 'black-player', 7, 7, 'white'), '棋子颜色不匹配');

  room.board[7][7] = 'W';
  assert.equal(validateMove(room, 'black-player', 7, 7, 'black'), '该位置已有棋子');
});

test('validateMove accepts a legal turn and full-board detection works', () => {
  const room = createRoomState('black-player');
  room.players.push({ id: 'white-player', piece: 'W' });
  room.status = 'playing';

  assert.equal(validateMove(room, 'black-player', 7, 7, 'black'), null);
  assert.equal(isValidPosition(14, 14), true);
  assert.equal(isValidPosition(15, 14), false);

  const board = createBoard().map((row, rowIndex) =>
    row.map((_, colIndex) => (rowIndex + colIndex) % 2 === 0 ? 'B' : 'W')
  );

  assert.equal(isBoardFull(board), true);
  board[14][14] = null;
  assert.equal(isBoardFull(board), false);
});

test('normalizeOrigin converts deployment URLs to browser origins', () => {
  assert.equal(
    normalizeOrigin('https://java-ys.github.io/gomoku-game'),
    'https://java-ys.github.io'
  );
  assert.equal(normalizeOrigin('http://localhost:3000'), 'http://localhost:3000');
});
