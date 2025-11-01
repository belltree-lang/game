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

export function sweepLines(board) {
  const cols = board[0].length;
  let cleared = 0;
  for (let row = board.length - 1; row >= 0; row -= 1) {
    if (board[row].every(Boolean)) {
      board.splice(row, 1);
      board.unshift(Array(cols).fill(0));
      cleared += 1;
      row += 1;
    }
  }
  return cleared;
}
