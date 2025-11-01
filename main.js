import { Bag, SHAPES } from "./pieces.js";
import {
  createMatrix,
  canPlace,
  mergePiece,
  sweepLines,
  addScore as calculateScore,
  calculateDropInterval,
} from "./board.js";
import { drawBoard, updateNextPreview, updateScoreboard, updateStatus } from "./render.js";

const COLS = 10;
const ROWS = 20;
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

let board = createMatrix(ROWS, COLS);
let bag = new Bag();
let currentPiece = null;
let nextPieceType = null;
let score = 0;
let totalLines = 0;
let level = 1;
let dropInterval = calculateDropInterval(1);
let dropCounter = 0;
let lastTime = 0;
let isRunning = false;
let isGameOver = false;

function resetBoard() {
  board = createMatrix(ROWS, COLS);
}

function currentMatrix() {
  if (!currentPiece) return null;
  const rotations = SHAPES[currentPiece.type];
  return rotations[currentPiece.rotationIndex];
}

function spawnPiece() {
  const type = nextPieceType ?? bag.draw();
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
      return;
    }
  }
  currentPiece = piece;
  nextPieceType = bag.draw();
  updateNextPreview(nextPieceType);
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
  mergePiece(board, currentPiece, matrix);
  const cleared = sweepLines(board);
  addScore(cleared);
  updateScoreboard(score, totalLines, level);
  dropCounter = 0;
  spawnPiece();
}

function addScore(linesCleared) {
  const nextState = calculateScore(
    { score, totalLines, level, dropInterval },
    linesCleared,
  );
  ({ score, totalLines, level, dropInterval } = nextState);
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;
  if (isRunning && !isGameOver) {
    dropCounter += delta;
    if (dropCounter >= dropInterval) {
      softDrop();
      dropCounter = 0;
    }
  }
  drawBoard(board, currentPiece, currentMatrix());
  requestAnimationFrame(update);
}

function restartGame() {
  resetBoard();
  bag = new Bag();
  currentPiece = null;
  nextPieceType = bag.draw();
  score = 0;
  totalLines = 0;
  level = 1;
  dropInterval = calculateDropInterval(1);
  dropCounter = 0;
  isRunning = true;
  isGameOver = false;
  updateScoreboard(score, totalLines, level);
  updateStatus("PLAY");
  updateNextPreview(nextPieceType);
  spawnPiece();
}

function gameOver() {
  isRunning = false;
  isGameOver = true;
  updateStatus("GAME OVER", "gameover");
}

function handleKeyDown(event) {
  if (event.code === "KeyR") {
    event.preventDefault();
    restartGame();
    return;
  }
  if (!isRunning || isGameOver) {
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

window.addEventListener("keydown", handleKeyDown);

update();
restartGame();
