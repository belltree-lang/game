import { COLORS, SHAPES } from "./pieces.js";

const BLOCK_SIZE = 32;

const boardCanvas = document.querySelector("#board");
const boardCtx = boardCanvas.getContext("2d");
boardCtx.imageSmoothingEnabled = false;

const nextCanvas = document.querySelector("#next");
const nextCtx = nextCanvas.getContext("2d");
nextCtx.imageSmoothingEnabled = false;

const scoreEl = document.querySelector("#score");
const linesEl = document.querySelector("#lines");
const levelEl = document.querySelector("#level");
const statusEl = document.querySelector("#status");

function drawCell(col, row, type) {
  const x = col * BLOCK_SIZE;
  const y = row * BLOCK_SIZE;
  const color = COLORS[type] || "#e2e8f0";
  boardCtx.fillStyle = color;
  boardCtx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  boardCtx.strokeStyle = "rgba(15, 23, 42, 0.65)";
  boardCtx.lineWidth = 2;
  boardCtx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  const highlight = "rgba(255, 255, 255, 0.25)";
  boardCtx.fillStyle = highlight;
  boardCtx.fillRect(x + 2, y + 2, BLOCK_SIZE - 6, (BLOCK_SIZE - 6) / 3);
}

export function drawBoard(board, currentPiece, currentMatrix) {
  const rows = board.length;
  const cols = board[0].length;
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.fillStyle = "#0b1120";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = board[row][col];
      if (cell) {
        drawCell(col, row, cell);
      } else {
        boardCtx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        boardCtx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  if (currentPiece && currentMatrix) {
    for (let row = 0; row < currentMatrix.length; row += 1) {
      for (let col = 0; col < currentMatrix[row].length; col += 1) {
        if (!currentMatrix[row][col]) continue;
        const drawRow = currentPiece.row + row;
        const drawCol = currentPiece.col + col;
        if (drawRow >= 0) {
          drawCell(drawCol, drawRow, currentPiece.type);
        }
      }
    }
  }
}

export function updateNextPreview(nextPieceType) {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextPieceType) return;
  const matrix = SHAPES[nextPieceType][0];
  const cellSize = 24;
  const width = matrix[0].length * cellSize;
  const height = matrix.length * cellSize;
  const offsetX = (nextCanvas.width - width) / 2;
  const offsetY = (nextCanvas.height - height) / 2;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      nextCtx.fillStyle = COLORS[nextPieceType];
      nextCtx.fillRect(x, y, cellSize - 2, cellSize - 2);
      nextCtx.strokeStyle = "rgba(15, 23, 42, 0.6)";
      nextCtx.strokeRect(x + 1, y + 1, cellSize - 4, cellSize - 4);
    }
  }
}

export function updateScoreboard(score, totalLines, level) {
  scoreEl.textContent = score.toString();
  linesEl.textContent = totalLines.toString();
  levelEl.textContent = level.toString();
}

export function updateStatus(text, state = "running") {
  statusEl.textContent = text;
  statusEl.dataset.state = state;
}
