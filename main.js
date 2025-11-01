const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;
const LINE_SCORE = { 1: 100, 2: 300, 3: 500, 4: 800 };

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

const COLORS = {
  I: "#38bdf8",
  O: "#facc15",
  T: "#a855f7",
  S: "#22c55e",
  Z: "#f97316",
  J: "#3b82f6",
  L: "#f59e0b",
};

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

class Bag {
  constructor() {
    this.queue = [];
    this.refill();
  }

  refill() {
    const types = Object.keys(SHAPES);
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.queue.push(...types);
  }

  draw() {
    if (this.queue.length === 0) {
      this.refill();
    }
    return this.queue.pop();
  }
}

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
const restartButton = document.querySelector("#restart");

let board = createMatrix(ROWS, COLS);
let bag = new Bag();
let currentPiece = null;
let nextPieceType = null;
let score = 0;
let totalLines = 0;
let level = 1;
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;
let isRunning = false;
let isGameOver = false;

function createMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function resetBoard() {
  board = createMatrix(ROWS, COLS);
}

function currentMatrix() {
  if (!currentPiece) return null;
  const rotations = SHAPES[currentPiece.type];
  return rotations[currentPiece.rotationIndex];
}

function canPlace(matrix, offsetRow, offsetCol) {
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const targetRow = offsetRow + row;
      const targetCol = offsetCol + col;
      if (targetCol < 0 || targetCol >= COLS) {
        return false;
      }
      if (targetRow >= ROWS) {
        return false;
      }
      if (targetRow >= 0 && board[targetRow][targetCol]) {
        return false;
      }
    }
  }
  return true;
}

function mergePiece() {
  const matrix = currentMatrix();
  if (!matrix || !currentPiece) return;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const targetRow = currentPiece.row + row;
      const targetCol = currentPiece.col + col;
      if (targetRow < 0 || targetRow >= ROWS || targetCol < 0 || targetCol >= COLS) {
        continue;
      }
      board[targetRow][targetCol] = currentPiece.type;
    }
  }
}

function sweepLines() {
  let cleared = 0;
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row].every(Boolean)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      cleared += 1;
      row += 1;
    }
  }
  return cleared;
}

function updateLevel() {
  const newLevel = Math.floor(totalLines / 10) + 1;
  if (newLevel !== level) {
    level = newLevel;
    dropInterval = Math.max(120, 1000 - (level - 1) * 100);
  }
}

function addScore(linesCleared) {
  if (!linesCleared) return;
  const base = LINE_SCORE[linesCleared] || 0;
  score += base * level;
  totalLines += linesCleared;
  updateLevel();
}

function updateScoreboard() {
  scoreEl.textContent = score.toString();
  linesEl.textContent = totalLines.toString();
  levelEl.textContent = level.toString();
}

function updateStatus(text, state = "running") {
  statusEl.textContent = text;
  statusEl.dataset.state = state;
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
  if (!canPlace(matrix, piece.row, piece.col)) {
    piece.row = 0;
    if (!canPlace(matrix, piece.row, piece.col)) {
      currentPiece = null;
      gameOver();
      return;
    }
  }
  currentPiece = piece;
  nextPieceType = bag.draw();
  updateNextPreview();
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
    if (canPlace(nextMatrix, nextRow, nextCol)) {
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
  if (canPlace(matrix, currentPiece.row, nextCol)) {
    currentPiece.col = nextCol;
  }
}

function softDrop() {
  if (!currentPiece) return;
  const matrix = currentMatrix();
  if (!matrix) return;
  const nextRow = currentPiece.row + 1;
  if (canPlace(matrix, nextRow, currentPiece.col)) {
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
  while (canPlace(matrix, currentPiece.row + 1, currentPiece.col)) {
    currentPiece.row += 1;
    distance += 1;
  }
  if (distance > 0) {
    score += distance * 2;
  }
  lockPiece();
}

function lockPiece() {
  mergePiece();
  const cleared = sweepLines();
  addScore(cleared);
  updateScoreboard();
  dropCounter = 0;
  spawnPiece();
}

function drawBoard() {
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.fillStyle = "#0b1120";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = board[row][col];
      if (cell) {
        drawCell(col, row, cell);
      } else {
        boardCtx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        boardCtx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
  if (currentPiece) {
    const matrix = currentMatrix();
    if (matrix) {
      for (let row = 0; row < matrix.length; row += 1) {
        for (let col = 0; col < matrix[row].length; col += 1) {
          if (!matrix[row][col]) continue;
          const drawRow = currentPiece.row + row;
          const drawCol = currentPiece.col + col;
          if (drawRow >= 0) {
            drawCell(drawCol, drawRow, currentPiece.type);
          }
        }
      }
    }
  }
}

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

function updateNextPreview() {
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
  drawBoard();
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
  dropInterval = 1000;
  dropCounter = 0;
  isRunning = true;
  isGameOver = false;
  updateScoreboard();
  updateStatus("PLAY");
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
