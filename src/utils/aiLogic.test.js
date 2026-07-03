import { checkWin, makeAiMove } from './aiLogic';

const createBoard = () => Array(15).fill(null).map(() => Array(15).fill(null));

test('checkWin detects five connected pieces', () => {
  const board = createBoard();

  for (let col = 0; col < 5; col++) {
    board[7][col] = 'B';
  }

  expect(checkWin(board, 7, 2, 'B')).toBe(true);
  expect(checkWin(board, 7, 2, 'W')).toBe(false);
});

test('AI plays the immediate winning move', () => {
  const board = createBoard();
  board[7][3] = 'W';
  board[7][4] = 'W';
  board[7][5] = 'W';
  board[7][6] = 'W';

  expect([
    { row: 7, col: 2 },
    { row: 7, col: 7 },
  ]).toContainEqual(makeAiMove(board, 'W'));
});

test('AI blocks the opponent immediate win', () => {
  const board = createBoard();
  board[8][3] = 'B';
  board[8][4] = 'B';
  board[8][5] = 'B';
  board[8][6] = 'B';

  expect([
    { row: 8, col: 2 },
    { row: 8, col: 7 },
  ]).toContainEqual(makeAiMove(board, 'W'));
});
