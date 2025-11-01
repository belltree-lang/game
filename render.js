import { COLORS, SHAPES } from "./pieces.js";
import { resizeCanvasToDisplaySize } from "./utils.js";

const BASE_BLOCK_SIZE = 32;
const BASE_BOARD_WIDTH = 320;
const BASE_BOARD_HEIGHT = 640;
const BASE_NEXT_CANVAS_SIZE = 120;
const BASE_NEXT_CELL = 24;

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
const srUpdatesEl = document.querySelector("#sr-updates");

let boardBlockSize = BASE_BLOCK_SIZE;
let lastScoreboardSnapshot = { score: null, totalLines: null, level: null };
let lastStatusText = "";

export function syncCanvasSizes() {
  const boardMetrics = resizeCanvasToDisplaySize(
    boardCanvas,
    BASE_BOARD_WIDTH,
    BASE_BOARD_HEIGHT,
  );
  boardBlockSize = BASE_BLOCK_SIZE * (boardMetrics.scale || 1);

  resizeCanvasToDisplaySize(nextCanvas, BASE_NEXT_CANVAS_SIZE, BASE_NEXT_CANVAS_SIZE);
}

syncCanvasSizes();

function drawCell(col, row, type) {
  const blockSize = boardBlockSize || BASE_BLOCK_SIZE;
  const x = col * blockSize;
  const y = row * blockSize;
  const color = COLORS[type] || "#e2e8f0";
  boardCtx.fillStyle = color;
  boardCtx.fillRect(x, y, blockSize, blockSize);
  boardCtx.strokeStyle = "rgba(15, 23, 42, 0.65)";
  const borderInset = Math.max(1, blockSize * 0.075);
  const borderSize = Math.max(1, blockSize - borderInset * 2);
  boardCtx.lineWidth = Math.max(1, blockSize * 0.08);
  boardCtx.strokeRect(
    x + borderInset,
    y + borderInset,
    borderSize,
    borderSize,
  );
  const highlight = "rgba(255, 255, 255, 0.25)";
  boardCtx.fillStyle = highlight;
  const highlightInset = Math.max(2, blockSize * 0.12);
  const highlightHeight = Math.max(2, blockSize * 0.28);
  boardCtx.fillRect(
    x + highlightInset,
    y + highlightInset,
    Math.max(2, blockSize - highlightInset * 2.5),
    highlightHeight,
  );
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
        const blockSize = boardBlockSize || BASE_BLOCK_SIZE;
        boardCtx.lineWidth = Math.max(1, blockSize * 0.05);
        boardCtx.strokeRect(
          col * blockSize,
          row * blockSize,
          blockSize,
          blockSize,
        );
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
  const widthScale = nextCanvas.width / BASE_NEXT_CANVAS_SIZE;
  const cellSize = Math.max(16, BASE_NEXT_CELL * widthScale);
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

  if (srUpdatesEl) {
    const changes = [];
    if (score !== lastScoreboardSnapshot.score) {
      changes.push(`スコア ${score}`);
    }
    if (totalLines !== lastScoreboardSnapshot.totalLines) {
      changes.push(`消去ライン ${totalLines}`);
    }
    if (level !== lastScoreboardSnapshot.level) {
      changes.push(`レベル ${level}`);
    }

    if (changes.length > 0) {
      srUpdatesEl.textContent = `${changes.join("、")}。`;
      lastScoreboardSnapshot = { score, totalLines, level };
    }
  }
}

export function updateStatus(text, state = "running") {
  if (text === lastStatusText && statusEl.dataset.state === state) {
    return;
  }
  statusEl.textContent = text;
  statusEl.dataset.state = state;
  lastStatusText = text;
}
