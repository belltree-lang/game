import { describe, expect, it } from "vitest";
import {
  addScore,
  calculateDropInterval,
  canPlace,
  createMatrix,
  sweepLines,
} from "./board.js";

const square = [
  [1, 1],
  [1, 1],
];

describe("canPlace", () => {
  it("allows placement on an empty board", () => {
    const board = createMatrix(4, 4);
    expect(canPlace(board, square, 0, 0)).toBe(true);
  });

  it("prevents placement when overlapping existing blocks", () => {
    const board = createMatrix(4, 4);
    board[1][1] = "X";
    expect(canPlace(board, square, 0, 0)).toBe(false);
  });

  it("prevents placement outside the horizontal bounds", () => {
    const board = createMatrix(4, 4);
    expect(canPlace(board, square, 0, -1)).toBe(false);
    expect(canPlace(board, square, 0, 3)).toBe(false);
  });

  it("prevents placement below the board", () => {
    const board = createMatrix(4, 4);
    expect(canPlace(board, square, 3, 0)).toBe(false);
  });
});

describe("sweepLines", () => {
  it("clears single and multiple full lines", () => {
    const board = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 0, 0, 1],
    ];

    const cleared = sweepLines(board);

    expect(cleared).toBe(2);
    expect(board).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 0, 0, 1],
    ]);
  });
});

describe("addScore", () => {
  it("awards points for single line clears", () => {
    const initial = {
      score: 0,
      totalLines: 0,
      level: 1,
      dropInterval: calculateDropInterval(1),
    };

    const updated = addScore(initial, 1);

    expect(updated).toEqual({
      score: 100,
      totalLines: 1,
      level: 1,
      dropInterval: calculateDropInterval(1),
    });
  });

  it("handles multiple line clears and keeps level until threshold", () => {
    const initial = {
      score: 100,
      totalLines: 1,
      level: 1,
      dropInterval: calculateDropInterval(1),
    };

    const updated = addScore(initial, 2);

    expect(updated).toEqual({
      score: 400,
      totalLines: 3,
      level: 1,
      dropInterval: calculateDropInterval(1),
    });
  });

  it("increases level and speeds up drop interval after enough lines", () => {
    const almostLevelUp = {
      score: 700,
      totalLines: 9,
      level: 1,
      dropInterval: calculateDropInterval(1),
    };

    const updated = addScore(almostLevelUp, 1);

    expect(updated).toEqual({
      score: 800,
      totalLines: 10,
      level: 2,
      dropInterval: calculateDropInterval(2),
    });
  });
});
