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

function lightenColor(hexColor, amount = 0.4) {
  if (!hexColor || typeof hexColor !== "string") return hexColor;
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return hexColor;
  const num = Number.parseInt(hex, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel) =>
    Math.round(channel + (255 - channel) * Math.min(Math.max(amount, 0), 1));
  const next = (mix(r) << 16) | (mix(g) << 8) | mix(b);
  return `#${next.toString(16).padStart(6, "0")}`;
}

function easeOutCubic(t) {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - clamped) ** 3;
}

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

function drawCell(col, row, type, options = {}) {
  const { alpha = 1, scale = 1, ghost = false, pulse = 0 } = options;
  const blockSize = boardBlockSize || BASE_BLOCK_SIZE;
  const size = blockSize * Math.max(Math.min(scale, 1.1), 0.25);
  const offset = (blockSize - size) / 2;
  const x = col * blockSize + offset;
  const y = row * blockSize + offset;
  const baseColor = COLORS[type] || "#e2e8f0";
  const fillColor = ghost ? lightenColor(baseColor, 0.65) : baseColor;
  const strokeColor = ghost
    ? "rgba(255, 255, 255, 0.55)"
    : "rgba(15, 23, 42, 0.65)";
  const highlightColor = ghost
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(255, 255, 255, 0.25)";

  boardCtx.save();
  boardCtx.globalAlpha = Math.min(Math.max(alpha, 0), 1);
  boardCtx.fillStyle = fillColor;
  boardCtx.fillRect(x, y, size, size);
  boardCtx.strokeStyle = strokeColor;
  const borderInset = Math.max(1, size * 0.075);
  const borderSize = Math.max(1, size - borderInset * 2);
  boardCtx.lineWidth = Math.max(1, size * 0.08);
  boardCtx.strokeRect(
    x + borderInset,
    y + borderInset,
    borderSize,
    borderSize,
  );
  const highlightInset = Math.max(2, size * 0.12);
  const highlightHeight = Math.max(2, size * 0.28);
  boardCtx.fillStyle = highlightColor;
  boardCtx.fillRect(
    x + highlightInset,
    y + highlightInset,
    Math.max(2, size - highlightInset * 2.5),
    highlightHeight,
  );
  if (pulse > 0 && !ghost) {
    const flashAlpha = Math.max(0, 0.45 - pulse * 0.45);
    if (flashAlpha > 0) {
      boardCtx.globalAlpha = flashAlpha;
      boardCtx.fillStyle = "#f8fafc";
      boardCtx.fillRect(x, y, size, size);
    }
  }
  boardCtx.restore();
}

function drawPiece(piece, matrix, options = {}) {
  if (!piece || !matrix) return;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const drawRow = piece.row + row;
      const drawCol = piece.col + col;
      if (drawRow >= 0) {
        drawCell(drawCol, drawRow, piece.type, options);
      }
    }
  }
}

export function drawBoard(
  board,
  currentPiece,
  currentMatrix,
  { ghostPiece = null, clearingRows = [], clearProgress = 0 } = {},
) {
  const rows = board.length;
  const cols = board[0].length;
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.fillStyle = "#0b1120";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  const clearingSet = new Set(clearingRows);
  const easedProgress = easeOutCubic(clearProgress);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = board[row][col];
      if (cell) {
        const isClearing = clearingSet.has(row);
        const alpha = isClearing ? Math.max(0, 1 - easedProgress) : 1;
        const scale = isClearing ? 1 - easedProgress * 0.2 : 1;
        drawCell(col, row, cell, {
          alpha,
          scale,
          pulse: isClearing ? easedProgress : 0,
        });
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

  if (ghostPiece && currentMatrix) {
    drawPiece(ghostPiece, currentMatrix, { alpha: 0.5, ghost: true });
  }

  if (currentPiece && currentMatrix) {
    drawPiece(currentPiece, currentMatrix);
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
