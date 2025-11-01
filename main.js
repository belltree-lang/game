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
  dealerIndex: 0,
  currentTurn: 0,
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
  state.currentTurn = 0;
  state.dealerIndex = 0;
  state.doraIndicator = null;
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
  for (let round = 0; round < 3; round += 1) {
    PLAYER_ORDER.forEach((player) => {
      for (let i = 0; i < 4; i += 1) {
        drawTile(player);
      }
    });
  }
  PLAYER_ORDER.forEach((player) => drawTile(player));
  const dealerKey = PLAYER_ORDER[state.dealerIndex];
  drawTile(dealerKey);
  // Dora indicator = last tile in wall (just peek)
  state.doraIndicator = state.wall[state.wall.length - 1] || null;
}

function discardTile(playerKey, tileId) {
  const hand = state.hands[playerKey];
  const tileIndex = hand.findIndex((tile) => tile.id === tileId);
  if (tileIndex === -1) return;
  const [tile] = hand.splice(tileIndex, 1);
  state.rivers[playerKey].push(tile);
  render();
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
      const button = document.createElement("button");
      button.className = "tile";
      button.type = "button";
      button.textContent = tile.text;
      button.dataset.tileId = tile.id;
      if (playerKey === "north") {
        button.addEventListener("click", () => {
          discardTile(playerKey, tile.id);
        });
      }
      handContainer.appendChild(button);
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
}

function startRound() {
  resetState();
  dealInitialHands();
  render();
  state.currentTurn = 0;
  const drawButton = document.querySelector("#draw-tile");
  if (drawButton) {
    drawButton.disabled = false;
  }
}

function handleDraw() {
  const tile = drawTile("north");
  if (!tile) {
    return;
  }
  render();
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
}

document.addEventListener("DOMContentLoaded", init);
