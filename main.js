const NUMBER_SUITS = [
  { key: "man", label: "萬子", values: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] },
  { key: "pin", label: "筒子", values: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] },
  { key: "sou", label: "索子", values: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] },
];

const HONORS = [
  { key: "east", label: "東" },
  { key: "south", label: "南" },
  { key: "west", label: "西" },
  { key: "north", label: "北" },
  { key: "white", label: "白" },
  { key: "green", label: "發" },
  { key: "red", label: "中" },
];

const PLAYER_ORDER = ["south", "east", "west", "north"];
const TURN_ORDER = ["north", "east", "south", "west"];
const PLAYER_NAMES = {
  south: "南家",
  east: "東家",
  west: "西家",
  north: "北家",
};

const state = {
  wall: [],
  hands: {
    south: [],
    east: [],
    west: [],
    north: [],
  },
  rivers: {
    south: [],
    east: [],
    west: [],
    north: [],
  },
  doraIndicator: null,
  turnIndex: 0,
  phase: "idle",
  isRoundActive: false,
  logMessages: [],
};

function createTile({ suit, value, copy }) {
  const isHonor = suit === "honor";
  const identifier = `${suit}-${value}-${copy}`;
  return {
    id: identifier,
    suit,
    value,
    isHonor,
    text: formatTileText(suit, value),
  };
}

function formatTileText(suit, value) {
  if (suit === "honor") {
    const honor = HONORS.find((item) => item.key === value);
    return honor ? honor.label : value;
  }
  const suitLabel = NUMBER_SUITS.find((item) => item.key === suit);
  const suffix = suitLabel ? suitLabel.label.charAt(0) : suit[0];
  return `${value}${suffix}`;
}

function buildWall() {
  const tiles = [];
  NUMBER_SUITS.forEach((suit) => {
    suit.values.forEach((value) => {
      for (let copy = 0; copy < 4; copy += 1) {
        tiles.push(createTile({ suit: suit.key, value, copy }));
      }
    });
  });
  HONORS.forEach((honor) => {
    for (let copy = 0; copy < 4; copy += 1) {
      tiles.push(createTile({ suit: "honor", value: honor.key, copy }));
    }
  });
  return tiles;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function resetState() {
  state.wall = shuffle(buildWall());
  state.hands = {
    south: [],
    east: [],
    west: [],
    north: [],
  };
  state.rivers = {
    south: [],
    east: [],
    west: [],
    north: [],
  };
  state.doraIndicator = null;
  state.turnIndex = 0;
  state.phase = "idle";
  state.isRoundActive = false;
  state.logMessages = [];
}

function drawTile(playerKey) {
  if (state.wall.length === 0) {
    return null;
  }
  const tile = state.wall.pop();
  state.hands[playerKey].push(tile);
  sortHand(playerKey);
  updateWallCount();
  return tile;
}

function sortHand(playerKey) {
  state.hands[playerKey].sort((a, b) => {
    if (a.suit === b.suit) {
      return a.value.localeCompare(b.value);
    }
    if (a.suit === "honor") return 1;
    if (b.suit === "honor") return -1;
    return a.suit.localeCompare(b.suit);
  });
}

function dealInitialHands() {
  PLAYER_ORDER.forEach((player) => {
    state.hands[player] = [];
  });
  for (let i = 0; i < 13; i += 1) {
    PLAYER_ORDER.forEach((player) => {
      drawTile(player);
    });
  }
  drawTile("north");
  // Dora indicator = last tile in wall (just peek)
  state.doraIndicator = state.wall[state.wall.length - 1] || null;
}

function discardTile(playerKey, tileId) {
  const hand = state.hands[playerKey];
  const tileIndex = hand.findIndex((tile) => tile.id === tileId);
  if (tileIndex === -1) return null;
  const [tile] = hand.splice(tileIndex, 1);
  state.rivers[playerKey].push(tile);
  return tile;
}

function updateWallCount() {
  const wallCount = document.querySelector("#wall-count");
  if (wallCount) {
    wallCount.textContent = state.wall.length.toString();
  }
}

function updateDoraIndicator() {
  const doraNode = document.querySelector("#dora-indicator");
  if (!doraNode) return;
  doraNode.textContent = state.doraIndicator ? state.doraIndicator.text : "未設定";
}

function appendLog(message) {
  state.logMessages.push(message);
  if (state.logMessages.length > 100) {
    state.logMessages.shift();
  }
  renderLog();
}

function renderLog() {
  const logList = document.querySelector("#log");
  if (!logList) {
    return;
  }
  logList.innerHTML = "";
  state.logMessages.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    logList.appendChild(item);
  });
  logList.scrollTop = logList.scrollHeight;
}

function renderHands() {
  document.querySelectorAll(".player").forEach((playerEl) => {
    const playerKey = playerEl.dataset.player;
    const handContainer = playerEl.querySelector('[data-role="hand"]');
    const riverContainer = playerEl.querySelector('[data-role="river"]');
    if (!playerKey || !handContainer || !riverContainer) {
      return;
    }

    handContainer.innerHTML = "";
    riverContainer.innerHTML = "";

    state.hands[playerKey].forEach((tile) => {
      const isPlayer = playerKey === "north";
      const elementTag = isPlayer ? "button" : "div";
      const tileElement = document.createElement(elementTag);
      tileElement.className = "tile";
      tileElement.textContent = tile.text;
      tileElement.dataset.tileId = tile.id;
      if (isPlayer) {
        tileElement.type = "button";
        tileElement.disabled = !state.isRoundActive || state.phase !== "discard";
        tileElement.addEventListener("click", () => {
          handlePlayerDiscard(tile.id);
        });
      }
      handContainer.appendChild(tileElement);
    });

    state.rivers[playerKey].forEach((tile) => {
      const span = document.createElement("span");
      span.className = "tile";
      span.textContent = tile.text;
      riverContainer.appendChild(span);
    });
  });
}

function render() {
  updateWallCount();
  updateDoraIndicator();
  renderHands();
  renderLog();
  updateControls();
}

function startRound() {
  resetState();
  dealInitialHands();
  state.isRoundActive = true;
  state.phase = "discard";
  state.turnIndex = TURN_ORDER.indexOf("north");
  appendLog("新しい局を開始しました。北家（あなた）が先手です。");
  render();
}

function handleDraw() {
  if (!state.isRoundActive || state.phase !== "draw") {
    return;
  }
  const tile = drawTile("north");
  if (!tile) {
    endRound("山が尽きました。流局です。");
    return;
  }
  appendLog(`あなた: ${tile.text} をツモ`);
  state.phase = "discard";
  state.turnIndex = TURN_ORDER.indexOf("north");
  render();
}

function handlePlayerDiscard(tileId) {
  if (!state.isRoundActive || state.phase !== "discard") {
    return;
  }
  const discarded = discardTile("north", tileId);
  if (!discarded) {
    return;
  }
  appendLog(`あなた: ${discarded.text} を捨てました`);
  state.phase = "cpu";
  state.turnIndex = getNextTurnIndex(state.turnIndex);
  render();
  processCpuTurns();
}

function processCpuTurns() {
  if (!state.isRoundActive) {
    return;
  }

  while (state.isRoundActive && TURN_ORDER[state.turnIndex] !== "north") {
    const playerKey = TURN_ORDER[state.turnIndex];
    const drawnTile = drawTile(playerKey);
    if (!drawnTile) {
      endRound("山が尽きました。流局です。");
      return;
    }
    const hand = state.hands[playerKey];
    if (hand.length === 0) {
      endRound(`${PLAYER_NAMES[playerKey]}の手牌が空になりました。`);
      return;
    }
    const discardIndex = Math.floor(Math.random() * hand.length);
    const tileToDiscard = hand[discardIndex];
    const discarded = discardTile(playerKey, tileToDiscard.id);
    if (discarded) {
      appendLog(`${PLAYER_NAMES[playerKey]}: ${discarded.text} を捨てました`);
    }
    render();
    state.turnIndex = getNextTurnIndex(state.turnIndex);
  }

  if (!state.isRoundActive) {
    return;
  }

  if (state.wall.length === 0) {
    endRound("山が尽きました。流局です。");
    return;
  }

  state.phase = "draw";
  state.turnIndex = TURN_ORDER.indexOf("north");
  render();
}

function endRound(message) {
  if (!state.isRoundActive) {
    return;
  }
  state.isRoundActive = false;
  state.phase = "finished";
  if (message) {
    appendLog(message);
  }
  render();
}

function getNextTurnIndex(index) {
  return (index + 1) % TURN_ORDER.length;
}

function updateControls() {
  const drawButton = document.querySelector("#draw-tile");
  if (drawButton) {
    drawButton.disabled = !state.isRoundActive || state.phase !== "draw";
  }
  const startButton = document.querySelector("#start-round");
  if (startButton) {
    startButton.textContent = state.isRoundActive ? "局をリセット" : "配牌スタート";
  }
}

function bindEvents() {
  const startButton = document.querySelector("#start-round");
  const drawButton = document.querySelector("#draw-tile");
  if (startButton) {
    startButton.addEventListener("click", () => {
      startRound();
    });
  }
  if (drawButton) {
    drawButton.addEventListener("click", () => {
      handleDraw();
    });
  }
}

function init() {
  bindEvents();
  render();
  startRound();
}

document.addEventListener("DOMContentLoaded", init);
