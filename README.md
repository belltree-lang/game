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

The repository also ships with a standalone HTML5版テトリス. Open `index.html`
in a modern browser to start playing instantly. The implementation relies solely
on HTML, CSS and vanilla JavaScript—no build step or external libraries.

### 主な特徴

- 10×20のプレイフィールドと7種類のテトリミノをサポート
- 7バッグ方式でテトリミノをランダム生成
- ソフトドロップ／ハードドロップ、回転、左右移動に対応
- ライン消去でスコア加算、一定行数ごとにレベルアップ＆落下加速
- 次のミノ表示、スコア・ライン・レベル表示、ゲームオーバー判定

### 操作方法

| キー | 動作 |
| --- | --- |
| ← / → | 左右に1マス移動 |
| ↑ | 右回転 |
| ↓ | ソフトドロップ |
| スペース | ハードドロップ |
| R | ゲームをリスタート |

行消去数に応じてスコアが加算され、10ラインごとにレベルが上がって落下速度が速くなります。

### テストの実行

ブラウザ版テトリスのコアロジックは [Vitest](https://vitest.dev/) で単体テストを用意しています。
ローカル環境では以下の手順で依存関係をインストールし、テストを実行できます。

```bash
npm install
npm test
```

## Module overview

- `mahjong.tiles` – definitions for tiles and helpers to build/shuffle the wall.
- `mahjong.player` – basic AI player that evaluates its hand and chooses discards.
- `mahjong.game` – game loop, hand evaluator and helper dataclasses.
- `main.py` – CLI for running a simulated round.

Feel free to expand the AI, add scoring or build a graphical interface on top of
the provided engine.
