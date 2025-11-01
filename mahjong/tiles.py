"""Tile definitions and helpers for a simplified Mahjong ruleset."""

from __future__ import annotations

import random
from collections import Counter
from dataclasses import dataclass
from typing import Iterable, Iterator, List, Sequence

NUMBER_SUITS = ("man", "pin", "sou")
HONORS = ("east", "south", "west", "north", "white", "green", "red")


class TileNotFound(LookupError):
    """Raised when attempting to remove a tile that is not present."""


@dataclass(frozen=True, order=True)
class Tile:
    """Representation of a Mahjong tile.

    The implementation is intentionally lightweight: only the ``suit`` and
    ``value`` attributes are stored. For suited tiles the value is a string in
    ``{"1", ..., "9"}``; for honors the value is one of :data:`HONORS`.
    """

    suit: str
    value: str

    def __post_init__(self) -> None:  # pragma: no cover - trivial validation
        if self.suit not in NUMBER_SUITS + ("honor",):
            raise ValueError(f"Unknown suit: {self.suit!r}")
        if self.suit == "honor":
            if self.value not in HONORS:
                raise ValueError(f"Unknown honor tile: {self.value!r}")
        else:
            if self.value not in {str(i) for i in range(1, 10)}:
                raise ValueError(f"Invalid tile value for {self.suit}: {self.value!r}")

    @property
    def is_honor(self) -> bool:
        return self.suit == "honor"

    @property
    def is_terminal(self) -> bool:
        return self.suit != "honor" and self.value in {"1", "9"}

    def __str__(self) -> str:  # pragma: no cover - presentation
        return f"{self.value}{self.suit[0]}" if not self.is_honor else self.value[0].upper()


_TILE_ORDER: List[Tile] = [
    Tile(suit, str(value))
    for suit in NUMBER_SUITS
    for value in range(1, 10)
] + [Tile("honor", honor) for honor in HONORS]
_TILE_INDEX = {tile: index for index, tile in enumerate(_TILE_ORDER)}


class TileCollection:
    """Mutable container for Mahjong tiles.

    The collection keeps a deterministic order (useful for pretty printing) but
    also exposes helpers to draw tiles from the "top" much like a real wall.
    """

    def __init__(self, tiles: Iterable[Tile] | None = None) -> None:
        self._tiles: List[Tile] = list(tiles or [])

    def __len__(self) -> int:
        return len(self._tiles)

    def __iter__(self) -> Iterator[Tile]:
        return iter(self._tiles)

    def append(self, tile: Tile) -> None:
        self._tiles.append(tile)

    def extend(self, tiles: Iterable[Tile]) -> None:
        self._tiles.extend(tiles)

    def pop(self, index: int = -1) -> Tile:
        if not self._tiles:
            raise IndexError("Cannot pop from an empty TileCollection")
        return self._tiles.pop(index)

    def draw(self) -> Tile:
        """Draw a tile from the end of the collection."""

        return self.pop()

    def remove(self, tile: Tile) -> None:
        """Remove a tile from the collection.

        Raises:
            TileNotFound: If the tile is not present.
        """

        try:
            self._tiles.remove(tile)
        except ValueError as exc:  # pragma: no cover - thin wrapper
            raise TileNotFound(str(exc)) from exc

    def sort(self) -> None:
        self._tiles.sort(key=_TILE_INDEX.get)

    def counts(self) -> Counter[Tile]:
        return Counter(self._tiles)

    def copy(self) -> "TileCollection":
        return TileCollection(self._tiles)

    def __repr__(self) -> str:  # pragma: no cover - presentation
        return f"TileCollection({self._tiles!r})"


def create_wall(seed: int | None = None) -> TileCollection:
    """Return a shuffled wall containing 136 tiles.

    The :class:`TileCollection` behaves similarly to the live wall in a Mahjong
    game: callers can repeatedly call :meth:`TileCollection.draw` to simulate
    drawing tiles. The optional *seed* argument makes the shuffle deterministic
    which is invaluable for unit tests and debugging sessions.
    """

    rng = random.Random(seed)
    tiles: List[Tile] = []
    for tile in _TILE_ORDER:
        tiles.extend([tile] * 4)
    rng.shuffle(tiles)
    return TileCollection(tiles)


def tile_sort_key(tile: Tile) -> int:
    """Return a deterministic sort key for *tile*."""

    return _TILE_INDEX[tile]


def format_tiles(tiles: Sequence[Tile]) -> str:
    """Return a compact human readable representation of *tiles*."""

    sorted_tiles = sorted(tiles, key=tile_sort_key)
    return " ".join(str(tile) for tile in sorted_tiles)
