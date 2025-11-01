import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./render.js", () => {
  const updateStatus = vi.fn((text, state) => {
    const statusEl = document.querySelector("#status");
    if (statusEl) {
      statusEl.textContent = text;
      if (state !== undefined) {
        statusEl.dataset.state = state;
      }
    }
  });

  const updateScoreboard = vi.fn((score, totalLines, level) => {
    const scoreEl = document.querySelector("#score");
    const linesEl = document.querySelector("#lines");
    const levelEl = document.querySelector("#level");
    if (scoreEl) scoreEl.textContent = String(score);
    if (linesEl) linesEl.textContent = String(totalLines);
    if (levelEl) levelEl.textContent = String(level);
  });

  const updateNextPreview = vi.fn();
  const drawBoard = vi.fn();
  const syncCanvasSizes = vi.fn();

  return { drawBoard, syncCanvasSizes, updateNextPreview, updateScoreboard, updateStatus };
});

vi.mock("./pieces.js", () => {
  class MockBag {
    constructor() {
      this.pool = ["I", "O", "T", "L", "J", "S", "Z"];
      this.index = 0;
    }

    draw() {
      const piece = this.pool[this.index % this.pool.length];
      this.index += 1;
      return piece;
    }
  }

  const SHAPES = {
    I: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
    O: [
      [
        [1, 1],
        [1, 1],
      ],
    ],
    T: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
    ],
    L: [
      [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
    ],
    J: [
      [
        [0, 0, 1],
        [0, 0, 1],
        [0, 1, 1],
      ],
    ],
    S: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
    ],
    Z: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
    ],
  };

  const COLORS = {
    I: "#38bdf8",
    O: "#facc15",
    T: "#a855f7",
    L: "#f97316",
    J: "#3b82f6",
    S: "#4ade80",
    Z: "#ef4444",
  };

  return { Bag: MockBag, SHAPES, COLORS };
});

describe("main game bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <div class="app-shell">
        <header class="app-header"></header>
        <main>
          <section class="hud">
            <p id="status" data-state=""></p>
            <p id="score"></p>
            <p id="level"></p>
            <p id="lines"></p>
            <p id="sr-updates"></p>
            <button id="restart"></button>
          </section>
          <section class="playfield">
            <canvas id="board" tabindex="0"></canvas>
            <canvas id="next"></canvas>
            <button id="focus-board"></button>
          </section>
        </main>
      </div>
    `;

    const boardCanvas = document.querySelector("#board");
    const nextCanvas = document.querySelector("#next");
    const canvasContext = () => ({
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      imageSmoothingEnabled: false,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
    });

    boardCanvas.getContext = vi.fn(canvasContext);
    boardCanvas.focus = vi.fn(() => {
      boardCanvas.dispatchEvent(new Event("focus"));
    });
    boardCanvas.blur = vi.fn(() => {
      boardCanvas.dispatchEvent(new Event("blur"));
    });
    nextCanvas.getContext = vi.fn(canvasContext);

    global.requestAnimationFrame = vi.fn();
  });

  it("initializes UI hooks and responds to keyboard interactions", async () => {
    const render = await import("./render.js");
    const {
      drawBoard,
      syncCanvasSizes,
      updateNextPreview,
      updateScoreboard,
      updateStatus,
    } = render;

    await import("./main.js");

    expect(syncCanvasSizes).toHaveBeenCalledTimes(1);
    expect(drawBoard).toHaveBeenCalled();

    const statusEl = document.querySelector("#status");
    expect(statusEl.textContent).toBe("キャンバスにフォーカスして操作できます");
    expect(statusEl.dataset.state).toBe("paused");

    const scoreEl = document.querySelector("#score");
    const linesEl = document.querySelector("#lines");
    const levelEl = document.querySelector("#level");
    expect(scoreEl.textContent).toBe("0");
    expect(linesEl.textContent).toBe("0");
    expect(levelEl.textContent).toBe("1");

    const boardCanvas = document.querySelector("#board");
    boardCanvas.dispatchEvent(new Event("pointerdown"));
    expect(boardCanvas.focus).toHaveBeenCalled();

    boardCanvas.dispatchEvent(new Event("focus"));
    expect(updateStatus).toHaveBeenLastCalledWith("PLAY");

    const arrowEvent = new KeyboardEvent("keydown", { code: "ArrowLeft" });
    arrowEvent.preventDefault = vi.fn();
    boardCanvas.dispatchEvent(arrowEvent);
    expect(arrowEvent.preventDefault).toHaveBeenCalled();

    boardCanvas.dispatchEvent(new Event("blur"));
    expect(updateStatus).toHaveBeenLastCalledWith("キャンバスにフォーカスして操作できます", "paused");

    const restartButton = document.querySelector("#restart");
    restartButton.blur = vi.fn();
    restartButton.click();
    expect(restartButton.blur).toHaveBeenCalled();
    expect(updateScoreboard).toHaveBeenLastCalledWith(0, 0, 1);

    const callsBefore = updateNextPreview.mock.calls.length;
    const rKeyEvent = new KeyboardEvent("keydown", { code: "KeyR" });
    rKeyEvent.preventDefault = vi.fn();
    window.dispatchEvent(rKeyEvent);
    expect(rKeyEvent.preventDefault).toHaveBeenCalled();
    expect(updateNextPreview.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
