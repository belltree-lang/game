"""Command line entry point for the Mahjong simulator."""

from __future__ import annotations

import argparse
from typing import List

from mahjong import MahjongGame, Player


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Simulate a round of Riichi Mahjong with simple AI players.")
    parser.add_argument("--seed", type=int, default=None, help="Optional seed for deterministic shuffles.")
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress the per-turn log output and print only the final result.",
    )
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    players = [Player(name) for name in ("East", "South", "West", "North")]
    game = MahjongGame(players, seed=args.seed)
    result = game.play_round(log=not args.quiet)

    if not args.quiet:
        for line in result.logs:
            print(line)
    print(result.summary())
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI glue
    raise SystemExit(main())
