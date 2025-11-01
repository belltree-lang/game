# Browser Tetris

A lightweight HTML5 Tetris implementation built with vanilla JavaScript. The game
runs entirely in the browser—no build step or external dependencies are
required.

## Getting started

Open `index.html` in a modern browser to start playing instantly. The canvas is
resizable and adapts to the available space, making it easy to test changes
without additional tooling.

For local development convenience you can also serve the repository with any
static file server, for example:

```bash
npx http-server .
```

## Controls

| Key | Action |
| --- | --- |
| ← / → | Move piece left / right |
| ↑ | Rotate clockwise |
| ↓ | Soft drop |
| Space | Hard drop |
| R | Restart the game |

## Features

- 10×20 playfield with standard Tetromino shapes generated using the 7-bag
  system.
- Soft drop, hard drop, rotation kicks, and horizontal movement.
- Line clear scoring with level progression that accelerates the drop speed.
- Next piece preview, scoreboard, status messaging, and keyboard focus hints.
- Responsive canvas rendering with crisp pixel art at any size.

## Running tests

The core gameplay logic is covered by unit tests using
[Vitest](https://vitest.dev/). Install dependencies and run the test suite with:

```bash
npm install
npm test
```

## Project structure

- `main.js` – game loop, input handling, and UI orchestration.
- `pieces.js` – Tetromino definitions and 7-bag generator.
- `board.js` – board helpers for collision detection, line clears, and scoring.
- `render.js` – canvas drawing routines and DOM updates.
- `utils.js` – shared utilities for working with canvas dimensions.
- `style.css` – layout and presentation for the browser UI.
- `index.html` – standalone entry point that wires everything together.
