export function createMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function canPlace(board, matrix, offsetRow, offsetCol) {
  if (!matrix) return false;
  const rows = board.length;
  const cols = board[0].length;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const targetRow = offsetRow + row;
      const targetCol = offsetCol + col;
      if (targetCol < 0 || targetCol >= cols) {
        return false;
      }
      if (targetRow >= rows) {
        return false;
      }
      if (targetRow >= 0 && board[targetRow][targetCol]) {
        return false;
      }
    }
  }
  return true;
}

export function mergePiece(board, piece, matrix) {
  if (!matrix || !piece) return;
  const rows = board.length;
  const cols = board[0].length;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const targetRow = piece.row + row;
      const targetCol = piece.col + col;
      if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) {
        continue;
      }
      board[targetRow][targetCol] = piece.type;
    }
  }
}

export function findFilledRows(board) {
  const rows = [];
  for (let row = board.length - 1; row >= 0; row -= 1) {
    if (board[row].every(Boolean)) {
      rows.push(row);
    }
  }
  return rows;
}

export function sweepLines(board, rowsToClear) {
  const cols = board[0].length;
  const targets = Array.isArray(rowsToClear)
    ? [...new Set(rowsToClear)]
    : findFilledRows(board);
  if (targets.length === 0) {
    return 0;
  }
  targets.sort((a, b) => b - a);
  for (const row of targets) {
    if (row < 0 || row >= board.length) continue;
    board.splice(row, 1);
  }
  for (let i = 0; i < targets.length; i += 1) {
    board.unshift(Array(cols).fill(0));
  }
  return targets.length;
}

const LINE_SCORE = { 1: 100, 2: 300, 3: 500, 4: 800 };
const BASE_DROP_INTERVAL = 1000;
const DROP_STEP = 100;
const MIN_DROP_INTERVAL = 120;

export function calculateDropInterval(level) {
  return Math.max(
    MIN_DROP_INTERVAL,
    BASE_DROP_INTERVAL - (Math.max(level, 1) - 1) * DROP_STEP,
  );
}

export function addScore(state, linesCleared) {
  const {
    score = 0,
    totalLines = 0,
    level = 1,
    dropInterval = calculateDropInterval(level),
  } = state;

  if (!linesCleared) {
    return { score, totalLines, level, dropInterval };
  }

  const base = LINE_SCORE[linesCleared] || 0;
  const newScore = score + base * level;
  const updatedLines = totalLines + linesCleared;
  const newLevel = Math.floor(updatedLines / 10) + 1;
  const newDropInterval = calculateDropInterval(newLevel);

  return {
    score: newScore,
    totalLines: updatedLines,
    level: newLevel,
    dropInterval: newDropInterval,
  };
}
