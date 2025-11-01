"""Player implementation for the Mahjong game."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Iterable, List

from .tiles import Tile, format_tiles, tile_sort_key


@dataclass
class Player:
    """Represents a Mahjong player with a very small AI.

    The AI is intentionally lightweight—it merely evaluates the suitability of
    each tile in the hand and discards the tile that contributes the least to a
    potential winning shape. The heuristic is deterministic which makes the
    simulation repeatable and aids debugging.
    """

    name: str
    hand: List[Tile] = field(default_factory=list)
    discards: List[Tile] = field(default_factory=list)

    def draw(self, tile: Tile) -> None:
        self.hand.append(tile)
        self.sort_hand()

    def sort_hand(self) -> None:
        self.hand.sort(key=tile_sort_key)

    def take_initial_hand(self, tiles: Iterable[Tile]) -> None:
        self.hand = list(tiles)
        self.sort_hand()

    def choose_discard(self) -> Tile:
        if not self.hand:
            raise ValueError("Cannot discard from an empty hand")

        counts = Counter(self.hand)
        evaluated = sorted(self.hand, key=lambda tile: (self._tile_score(tile, counts), tile_sort_key(tile)))
        tile = evaluated[0]
        self.hand.remove(tile)
        self.discards.append(tile)
        return tile

    def _tile_score(self, tile: Tile, counts: Counter[Tile]) -> int:
        """Return a heuristic score for *tile*.

        Lower scores indicate worse tiles (i.e. more likely to be discarded).
        The scoring favours triplets, sequences and honour tiles with duplicates.
        """

        score = counts[tile] * 3
        if tile.is_honor:
            return score

        value = int(tile.value)
        neighbours = 0
        for offset in (-2, -1, 1, 2):
            candidate_value = value + offset
            if 1 <= candidate_value <= 9:
                candidate = Tile(tile.suit, str(candidate_value))
                if counts[candidate]:
                    neighbours += 1
        return score + neighbours

    def describe_hand(self) -> str:
        return format_tiles(self.hand)

    def describe_discards(self) -> str:
        return format_tiles(self.discards)
