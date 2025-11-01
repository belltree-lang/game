"""Top-level package for the Mahjong game engine."""

from .tiles import Tile, TileCollection, create_wall, TileNotFound
from .player import Player
from .game import MahjongGame, GameResult

__all__ = [
    "Tile",
    "TileCollection",
    "TileNotFound",
    "create_wall",
    "Player",
    "MahjongGame",
    "GameResult",
]
