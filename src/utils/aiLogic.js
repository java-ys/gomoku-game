// 方向：水平、垂直、左下到右上对角线、左上到右下对角线
const directions = [
  { dr: 0, dc: 1 },  // 水平
  { dr: 1, dc: 0 },  // 垂直
  { dr: 1, dc: 1 },  // 左上到右下对角线
  { dr: 1, dc: -1 }, // 左下到右上对角线
];

// 检查是否有五子连珠
export const checkWin = (board, row, col, player) => {
  for (const { dr, dc } of directions) {
    let count = 1;
    
    // 正向检查
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== player) {
        break;
      }
      count++;
    }
    
    // 反向检查
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== player) {
        break;
      }
      count++;
    }
    
    if (count >= 5) {
      return true;
    }
  }
  
  return false;
};

// 简化版评估棋型分数 - 更快速
const evaluatePattern = (pattern, player) => {
  const opponent = player === 'B' ? 'W' : 'B';
  
  // 五连
  if (pattern.includes(`${player}${player}${player}${player}${player}`)) {
    return 100000;
  }
  
  // 活四 (两端都空)
  if (pattern.includes(` ${player}${player}${player}${player} `)) {
    return 10000;
  }
  
  // 冲四 (一端被堵)
  if (
    pattern.includes(`${player}${player}${player}${player} `) ||
    pattern.includes(` ${player}${player}${player}${player}`) ||
    pattern.includes(`${player} ${player}${player}${player}`) ||
    pattern.includes(`${player}${player} ${player}${player}`) ||
    pattern.includes(`${player}${player}${player} ${player}`)
  ) {
    return 1000;
  }
  
  // 活三
  if (
    pattern.includes(` ${player}${player}${player}  `) ||
    pattern.includes(`  ${player}${player}${player} `) ||
    pattern.includes(` ${player} ${player}${player} `) ||
    pattern.includes(` ${player}${player} ${player} `)
  ) {
    return 500;
  }
  
  // 眠三
  if (
    pattern.includes(`${opponent}${player}${player}${player} `) ||
    pattern.includes(` ${player}${player}${player}${opponent}`) ||
    pattern.includes(`${player} ${player}${player}${opponent}`) ||
    pattern.includes(`${opponent}${player} ${player}${player}`) ||
    pattern.includes(`${opponent}${player}${player} ${player}`)
  ) {
    return 100;
  }
  
  // 活二
  if (
    pattern.includes(`  ${player}${player}  `) ||
    pattern.includes(` ${player} ${player} `)
  ) {
    return 50;
  }
  
  // 眠二
  if (
    pattern.includes(`${opponent}${player}${player} `) ||
    pattern.includes(` ${player}${player}${opponent}`)
  ) {
    return 10;
  }
  
  return 1;
};

// 获取一个方向上的棋型
const getPattern = (board, row, col, dr, dc, length, player) => {
  let pattern = '';
  
  for (let i = -length; i <= length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) {
      pattern += 'X'; // 超出边界
    } else if (board[r][c] === null) {
      pattern += ' '; // 空位
    } else {
      pattern += board[r][c]; // 棋子
    }
  }
  
  return pattern;
};

// 快速评估位置分数
const evaluatePosition = (board, row, col, player) => {
  if (board[row][col] !== null) {
    return -1; // 已有棋子
  }
  
  let score = 0;
  const opponent = player === 'B' ? 'W' : 'B';
  
  // 中心位置加分
  const centerRow = Math.floor(board.length / 2);
  const centerCol = Math.floor(board[0].length / 2);
  const distanceToCenter = Math.sqrt(
    Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
  );
  score += (board.length - distanceToCenter) * 2;
  
  // 临时放置棋子检查是否能赢
  const tempBoard = board.map(r => [...r]);
  tempBoard[row][col] = player;
  
  // 如果能直接获胜，给予最高分
  if (checkWin(tempBoard, row, col, player)) {
    return 100000;
  }
  
  // 检查是否能阻止对手获胜
  tempBoard[row][col] = opponent;
  if (checkWin(tempBoard, row, col, opponent)) {
    return 50000;
  }
  
  // 评估四个方向的棋型
  for (const { dr, dc } of directions) {
    const pattern = getPattern(board, row, col, dr, dc, 4, player);
    score += evaluatePattern(pattern, player);
    
    // 评估防守
    const opponentPattern = getPattern(board, row, col, dr, dc, 4, opponent);
    score += evaluatePattern(opponentPattern, opponent) * 0.8;
  }
  
  // 考虑周围棋子的影响
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      
      const r = row + dr;
      const c = col + dc;
      if (
        r >= 0 && r < board.length && 
        c >= 0 && c < board[0].length && 
        board[r][c] !== null
      ) {
        // 如果周围有己方棋子，额外加分
        if (board[r][c] === player) {
          score += 5;
        }
      }
    }
  }
  
  return score;
};

// AI做出决策 - 优化版
export const makeAiMove = (board, player) => {
  // 如果棋盘为空，直接下在中心点
  if (board.every(row => row.every(cell => cell === null))) {
    const centerRow = Math.floor(board.length / 2);
    const centerCol = Math.floor(board[0].length / 2);
    return { row: centerRow, col: centerCol };
  }
  
  // 创建可能的移动列表
  const possibleMoves = [];
  
  // 只考虑已有棋子周围的空位
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      if (board[row][col] === null) {
        let hasNeighbor = false;
        
        // 检查2格范围内是否有棋子
        outerLoop: for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const r = row + dr;
            const c = col + dc;
            if (
              r >= 0 && r < board.length && 
              c >= 0 && c < board[0].length && 
              board[r][c] !== null
            ) {
              hasNeighbor = true;
              break outerLoop;
            }
          }
        }
        
        if (hasNeighbor) {
          // 评估位置
          const score = evaluatePosition(board, row, col, player);
          if (score > 0) {
            possibleMoves.push({ row, col, score });
          }
        }
      }
    }
  }
  
  // 如果没有找到合适的位置，随机选择一个空位
  if (possibleMoves.length === 0) {
    const emptyPositions = [];
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length; col++) {
        if (board[row][col] === null) {
          emptyPositions.push({ row, col });
        }
      }
    }
    
    if (emptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      return emptyPositions[randomIndex];
    }
    
    // 棋盘已满
    return null;
  }
  
  // 按分数排序
  possibleMoves.sort((a, b) => b.score - a.score);
  
  // 如果最高分有多个，随机选择一个
  const highestScore = possibleMoves[0].score;
  const bestMoves = possibleMoves.filter(move => move.score === highestScore);
  
  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[randomIndex];
}; 