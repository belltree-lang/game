import { Bag, SHAPES } from "./pieces.js";
import {
  createMatrix,
  canPlace,
  mergePiece,
  sweepLines,
  addScore as calculateScore,
  calculateDropInterval,
  findFilledRows,
} from "./board.js";
import {
  drawBoard,
  syncCanvasSizes,
  updateNextPreview,
  updateHoldPreview,
  updateScoreboard,
  updateStatus,
} from "./render.js";

const COLS = 10;
const ROWS = 20;
const LINE_CLEAR_ANIMATION_DURATION = 260;
const NEXT_QUEUE_SIZE = 5;
const NORMAL_KICKS = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: -1, row: 0 },
  { col: 0, row: -1 },
  { col: 2, row: 0 },
  { col: -2, row: 0 },
];

const I_KICKS = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: -1, row: 0 },
  { col: 0, row: -1 },
  { col: 0, row: 1 },
  { col: 2, row: 0 },
  { col: -2, row: 0 },
];

const restartButton = document.querySelector("#restart");
const boardCanvas = document.querySelector("#board");
const focusBoardButton = document.querySelector("#focus-board");

let board = createMatrix(ROWS, COLS);
let bag = new Bag();
let currentPiece = null;
let nextQueue = [];
let holdPieceType = null;
let hasHeldThisTurn = false;
let score = 0;
let totalLines = 0;
let level = 1;
let dropInterval = calculateDropInterval(1);
let dropCounter = 0;
let lastTime = 0;
let isRunning = false;
let isGameOver = false;
let isBoardFocused = false;
let clearingState = null;

const FOCUS_PROMPT_TEXT = "キャンバスにフォーカスして操作できます";

function resetBoard() {
  board = createMatrix(ROWS, COLS);
}

function currentMatrix() {
  if (!currentPiece) return null;
  const rotations = SHAPES[currentPiece.type];
  return rotations[currentPiece.rotationIndex];
}

function drawNextType() {
  if (nextQueue.length === 0) {
    refillNextQueue();
  }
  const nextType = nextQueue.shift();
  refillNextQueue();
  return nextType;
}

function refillNextQueue() {
  while (nextQueue.length < NEXT_QUEUE_SIZE) {
    nextQueue.push(bag.draw());
  }
}

function spawnPiece(typeOverride = null, { resetHoldUsage = true } = {}) {
  const type = typeOverride ?? drawNextType();
  const initialRow = type === "I" ? -1 : -2;
  const piece = {
    type,
    rotationIndex: 0,
    row: initialRow,
    col: Math.floor(COLS / 2) - 2,
  };
  const matrix = SHAPES[type][0];
  if (!canPlace(board, matrix, piece.row, piece.col)) {
    piece.row = 0;
    if (!canPlace(board, matrix, piece.row, piece.col)) {
      currentPiece = null;
      gameOver();
      updateNextPreview(nextQueue);
      return;
    }
  }
  currentPiece = piece;
  dropCounter = 0;
  if (resetHoldUsage) {
    hasHeldThisTurn = false;
  }
  updateNextPreview(nextQueue);
}

function rotatePiece() {
  if (!currentPiece) return;
  const rotations = SHAPES[currentPiece.type];
  const nextIndex = (currentPiece.rotationIndex + 1) % rotations.length;
  const nextMatrix = rotations[nextIndex];
  const kicks = currentPiece.type === "I" ? I_KICKS : NORMAL_KICKS;
  for (const kick of kicks) {
    const nextRow = currentPiece.row + kick.row;
    const nextCol = currentPiece.col + kick.col;
    if (canPlace(board, nextMatrix, nextRow, nextCol)) {
      currentPiece.rotationIndex = nextIndex;
      currentPiece.row = nextRow;
      currentPiece.col = nextCol;
      return;
    }
  }
}

function movePiece(deltaCol) {
  if (!currentPiece) return;
  const matrix = currentMatrix();
  if (!matrix) return;
  const nextCol = currentPiece.col + deltaCol;
  if (canPlace(board, matrix, currentPiece.row, nextCol)) {
    currentPiece.col = nextCol;
  }
}

function softDrop() {
  if (clearingState) return;
  if (!currentPiece) return;
  const matrix = currentMatrix();
  if (!matrix) return;
  const nextRow = currentPiece.row + 1;
  if (canPlace(board, matrix, nextRow, currentPiece.col)) {
    currentPiece.row = nextRow;
    dropCounter = 0;
  } else {
    lockPiece();
  }
}

function hardDrop() {
  if (clearingState) return;
  if (!currentPiece) return;
  const matrix = currentMatrix();
  if (!matrix) return;
  let distance = 0;
  while (canPlace(board, matrix, currentPiece.row + 1, currentPiece.col)) {
    currentPiece.row += 1;
    distance += 1;
  }
  if (distance > 0) {
    score += distance * 2;
  }
  lockPiece();
}

function lockPiece() {
  const matrix = currentMatrix();
  if (!currentPiece || !matrix) return;
  mergePiece(board, currentPiece, matrix);
  dropCounter = 0;
  const filledRows = findFilledRows(board);
  if (filledRows.length > 0) {
    clearingState = {
      rows: filledRows,
      elapsed: 0,
    };
    currentPiece = null;
  } else {
    updateScoreboard(score, totalLines, level);
    spawnPiece();
  }
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;
  if (isRunning && !isGameOver) {
    if (clearingState) {
      clearingState.elapsed += delta;
      if (clearingState.elapsed >= LINE_CLEAR_ANIMATION_DURATION) {
        finalizeLineClear();
      }
    } else {
      dropCounter += delta;
      if (dropCounter >= dropInterval) {
        softDrop();
        dropCounter = 0;
      }
    }
  }
  const matrix = currentMatrix();
  const ghostPiece = getGhostPiece(matrix);
  drawBoard(board, currentPiece, matrix, {
    ghostPiece,
    clearingRows: clearingState?.rows ?? [],
    clearProgress: clearingState
      ? Math.min(1, clearingState.elapsed / LINE_CLEAR_ANIMATION_DURATION)
      : 0,
  });
  requestAnimationFrame(update);
}

function restartGame() {
  resetBoard();
  bag = new Bag();
  currentPiece = null;
  nextQueue = [];
  holdPieceType = null;
  hasHeldThisTurn = false;
  refillNextQueue();
  score = 0;
  totalLines = 0;
  level = 1;
  dropInterval = calculateDropInterval(1);
  dropCounter = 0;
  clearingState = null;
  isRunning = true;
  isGameOver = false;
  updateScoreboard(score, totalLines, level);
  updateHoldPreview(null);
  updateNextPreview(nextQueue);
  spawnPiece();
  showFocusPrompt();
}

function gameOver() {
  isRunning = false;
  isGameOver = true;
  updateStatus("GAME OVER", "gameover");
}

function showFocusPrompt() {
  if (!isGameOver) {
    updateStatus(FOCUS_PROMPT_TEXT, "paused");
  }
}

function handleKeyDown(event) {
  if (event.code === "KeyR") {
    event.preventDefault();
    restartGame();
    return;
  }
  if (!isRunning || isGameOver || !isBoardFocused) {
    return;
  }
  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      movePiece(-1);
      break;
    case "ArrowRight":
      event.preventDefault();
      movePiece(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      rotatePiece();
      break;
    case "ArrowDown":
      event.preventDefault();
      softDrop();
      break;
    case "ShiftLeft":
    case "ShiftRight":
    case "KeyC":
      event.preventDefault();
      holdCurrentPiece();
      break;
    case "Space":
    case "Spacebar":
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

restartButton.addEventListener("click", () => {
  restartGame();
  restartButton.blur();
});

if (boardCanvas) {
  boardCanvas.addEventListener("pointerdown", () => {
    boardCanvas.focus();
  });
  boardCanvas.addEventListener("focus", () => {
    isBoardFocused = true;
    if (isRunning && !isGameOver) {
      updateStatus("PLAY");
    }
  });
  boardCanvas.addEventListener("blur", () => {
    isBoardFocused = false;
    if (isRunning && !isGameOver) {
      showFocusPrompt();
    }
  });
  boardCanvas.addEventListener("keydown", handleKeyDown);
}

if (focusBoardButton && boardCanvas) {
  focusBoardButton.addEventListener("click", (event) => {
    event.preventDefault();
    boardCanvas.focus();
  });
}

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR") {
    handleKeyDown(event);
  }
});

function handleResize() {
  syncCanvasSizes();
  updateNextPreview(nextQueue);
  updateHoldPreview(holdPieceType);
}

window.addEventListener("resize", handleResize);

syncCanvasSizes();
showFocusPrompt();

update();
restartGame();

function addScore(linesCleared) {
  const nextState = calculateScore(
    { score, totalLines, level, dropInterval },
    linesCleared,
  );
  ({ score, totalLines, level, dropInterval } = nextState);
}

function finalizeLineClear() {
  if (!clearingState) return;
  const cleared = sweepLines(board, clearingState.rows);
  addScore(cleared);
  updateScoreboard(score, totalLines, level);
  clearingState = null;
  spawnPiece();
}

function getGhostPiece(matrix = currentMatrix()) {
  if (!currentPiece || !matrix || clearingState) return null;
  const ghost = { ...currentPiece };
  while (canPlace(board, matrix, ghost.row + 1, ghost.col)) {
    ghost.row += 1;
  }
  return ghost;
}

function holdCurrentPiece() {
  if (!currentPiece || clearingState || hasHeldThisTurn) {
    return;
  }
  const currentType = currentPiece.type;
  const nextType = holdPieceType;
  holdPieceType = currentType;
  updateHoldPreview(holdPieceType);
  if (nextType) {
    spawnPiece(nextType, { resetHoldUsage: false });
  } else {
    spawnPiece(null, { resetHoldUsage: false });
  }
  hasHeldThisTurn = true;
}
