import { describe, expect, it } from "vitest";
import { Bag, SHAPES } from "./pieces.js";

describe("Bag", () => {
  it("returns each piece exactly once before repeating", () => {
    const bag = new Bag();
    const drawn = new Set();

    for (let i = 0; i < 7; i += 1) {
      drawn.add(bag.draw());
    }

    const expectedTypes = Object.keys(SHAPES).sort();
    expect(Array.from(drawn).sort()).toEqual(expectedTypes);
  });

  it("keeps distribution balanced across consecutive draws", () => {
    const bag = new Bag();
    const counts = Object.fromEntries(Object.keys(SHAPES).map((type) => [type, 0]));

    for (let i = 0; i < 14; i += 1) {
      const type = bag.draw();
      counts[type] += 1;
    }

    Object.values(counts).forEach((count) => {
      expect(count).toBe(2);
    });
  });
});
