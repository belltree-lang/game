"""Game loop and hand evaluation for Mahjong."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Iterable, List, Optional, Sequence

from .player import Player
from .tiles import HONORS, NUMBER_SUITS, Tile, TileCollection, create_wall, format_tiles, tile_sort_key


@dataclass
class GameResult:
    """Outcome of a played Mahjong round."""

    winner: Optional[Player]
    winning_tile: Optional[Tile] = None
    draw: bool = False
    turns: int = 0
    logs: List[str] = field(default_factory=list)

    def summary(self) -> str:
        if self.draw:
            return "The round ended in an exhaustive draw."
        assert self.winner is not None
        return (
            f"{self.winner.name} wins after {self.turns} turns with hand: "
            f"{format_tiles(self.winner.hand)} (winning tile {self.winning_tile})"
        )


class MahjongGame:
    """Simplified four-player Mahjong game simulator."""

    def __init__(self, players: Iterable[Player], seed: int | None = None) -> None:
        self.players: List[Player] = list(players)
        if len(self.players) != 4:
            raise ValueError("The simulator expects exactly four players.")
        self.seed = seed
        self.wall: TileCollection = TileCollection()
        self.discards: List[Tile] = []
        self.turn = 0

    def setup_round(self) -> None:
        self.wall = create_wall(self.seed)
        self.discards = []
        self.turn = 0
        for player in self.players:
            player.hand.clear()
            player.discards.clear()
        # Deal 13 tiles to each player in order
        for player in self.players:
            starting_hand = [self.wall.draw() for _ in range(13)]
            player.take_initial_hand(starting_hand)

    def play_round(self, max_turns: int | None = None, log: bool = True) -> GameResult:
        self.setup_round()
        logs: List[str] = []
        player_index = 0
        max_turns = max_turns or len(self.wall)

        while len(self.wall) > 0 and self.turn < max_turns:
            player = self.players[player_index]
            drawn_tile = self.wall.draw()
            player.draw(drawn_tile)
            self.turn += 1
            if log:
                logs.append(f"Turn {self.turn}: {player.name} draws {drawn_tile} -> {player.describe_hand()}")

            if is_winning_hand(player.hand):
                result = GameResult(
                    winner=player,
                    winning_tile=drawn_tile,
                    draw=False,
                    turns=self.turn,
                    logs=logs,
                )
                if log:
                    logs.append(f"{player.name} wins!")
                return result

            discard = player.choose_discard()
            self.discards.append(discard)
            if log:
                logs.append(f"{player.name} discards {discard}. Discards: {player.describe_discards()}")

            player_index = (player_index + 1) % len(self.players)

        return GameResult(winner=None, draw=True, turns=self.turn, logs=logs)


def is_winning_hand(hand: Sequence[Tile]) -> bool:
    """Return ``True`` if *hand* forms a winning hand under basic rules."""

    if len(hand) != 14:
        return False

    counts = Counter(hand)
    if any(count > 4 for count in counts.values()):
        return False

    if _is_thirteen_orphans(counts):
        return True

    return _standard_hand_checker(counts)


def _standard_hand_checker(counts: Counter[Tile]) -> bool:
    # Try every possible pair and see if the rest of the tiles form melds.
    for tile, count in list(counts.items()):
        if count >= 2:
            counts[tile] -= 2
            if counts[tile] == 0:
                del counts[tile]
            if _can_form_melds(counts):
                counts[tile] = counts.get(tile, 0) + 2
                return True
            counts[tile] = counts.get(tile, 0) + 2
    return False


def _can_form_melds(counts: Counter[Tile]) -> bool:
    if not counts:
        return True

    tile = min(counts, key=tile_sort_key)
    remaining = counts[tile]

    if remaining >= 3:
        counts[tile] -= 3
        if counts[tile] == 0:
            del counts[tile]
        if _can_form_melds(counts):
            counts[tile] = counts.get(tile, 0) + 3
            return True
        counts[tile] = counts.get(tile, 0) + 3

    if tile.suit in NUMBER_SUITS:
        value = int(tile.value)
        if value <= 7:
            sequence_tiles = [Tile(tile.suit, str(value + i)) for i in range(3)]
        else:
            sequence_tiles = []
        if sequence_tiles and all(counts.get(seq_tile, 0) > 0 for seq_tile in sequence_tiles):
            for seq_tile in sequence_tiles:
                counts[seq_tile] -= 1
                if counts[seq_tile] == 0:
                    del counts[seq_tile]
            if _can_form_melds(counts):
                for seq_tile in sequence_tiles:
                    counts[seq_tile] = counts.get(seq_tile, 0) + 1
                return True
            for seq_tile in sequence_tiles:
                counts[seq_tile] = counts.get(seq_tile, 0) + 1

    return False


def _is_thirteen_orphans(counts: Counter[Tile]) -> bool:
    required_terminals = {
        Tile("man", "1"),
        Tile("man", "9"),
        Tile("pin", "1"),
        Tile("pin", "9"),
        Tile("sou", "1"),
        Tile("sou", "9"),
    }
    required_honors = {Tile("honor", honor) for honor in HONORS}
    required_tiles = required_terminals | required_honors

    unique_tiles = {tile for tile, count in counts.items() if count > 0}
    if not required_tiles.issubset(unique_tiles):
        return False

    pair_found = any(count >= 2 for tile, count in counts.items() if tile in required_tiles)
    return pair_found and sum(counts.values()) == 14
