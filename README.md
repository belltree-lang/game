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

## Browser prototype

An experimental browser front-end that mirrors the Python engine is available in
`index.html`. Open the file directly in a browser to try the lightweight UI. It
currently supports the following features:

- 136-tile wall with Fisher–Yates shuffle
- Automatic distribution of starting hands (dealer receives 14 tiles)
- Dora indicator display and wall counter
- Manual draws and discards for the player at the bottom of the table (click a
  tile to discard)

Further features such as calls (チー・ポン・カン), win detection and scoring are
planned but not yet implemented.

## Module overview

- `mahjong.tiles` – definitions for tiles and helpers to build/shuffle the wall.
- `mahjong.player` – basic AI player that evaluates its hand and chooses discards.
- `mahjong.game` – game loop, hand evaluator and helper dataclasses.
- `main.py` – CLI for running a simulated round.

Feel free to expand the AI, add scoring or build a graphical interface on top of
the provided engine.
