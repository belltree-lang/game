# Mahjong Game

A lightweight command-line simulator for a four-player Riichi Mahjong round.
Four automated players draw and discard tiles according to a simple heuristic
and the engine detects standard winning hands (four melds and a pair) as well as
Thirteen Orphans.

## Getting started

The project has no runtime dependencies beyond Python 3.10+. To play a round use
`python main.py`:

```bash
python main.py
```

Pass `--quiet` to suppress per-turn logs and `--seed` to reproduce a specific
shuffle:

```bash
python main.py --seed 1234 --quiet
```

The script exits once a player wins or the wall is exhausted.

## Module overview

- `mahjong.tiles` – definitions for tiles and helpers to build/shuffle the wall.
- `mahjong.player` – basic AI player that evaluates its hand and chooses discards.
- `mahjong.game` – game loop, hand evaluator and helper dataclasses.
- `main.py` – CLI for running a simulated round.

Feel free to expand the AI, add scoring or build a graphical interface on top of
the provided engine.
