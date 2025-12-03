# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Molar is an Electron-based chess GUI that allows users to play chess against UCI-compatible chess engines (like Stockfish). The app uses chess.js for game logic/validation and chessground (Lichess's board component) for the interactive UI.

## Build Commands

```bash
# Build both main and renderer processes
npm run build

# Build only main process (TypeScript compilation)
npm run build:main

# Build only renderer process (esbuild bundling)
npm run build:renderer

# Build and run the application
npm run dev
```

## Architecture

### Process Separation (Electron Multi-Process Model)

**Main Process** (`src/main/`):
- Entry point: `src/main/main.ts`
- Manages UCI chess engine as a child process
- Handles all IPC communication via handlers in `src/main/ipc/handlers.ts`
- Must use CommonJS modules (compiled by TypeScript)

**Renderer Process** (`src/renderer/`):
- Entry point: `src/renderer/index.ts`
- Handles UI, user input, and chess game state (chess.js instance)
- Bundled as a single file by esbuild (ES modules → single bundle)
- Loaded in `index.html` as a regular script tag

**Preload Script** (`src/preload.ts`):
- Security bridge between main and renderer processes
- Uses `contextBridge` to expose safe IPC API as `window.electronAPI`
- Type definitions are inlined (no imports) to avoid module resolution issues
- Compiled with main process (CommonJS)

**Shared Types** (`src/shared/types.ts`):
- Common TypeScript interfaces used by both processes
- IPC channel definitions, game configuration types

### UCI Engine Integration

The UCI protocol implementation is in `src/main/uci/`:
- `UCIEngine.ts`: Main class that spawns engine process, manages stdin/stdout
- `parser.ts`: Parses UCI protocol messages (bestmove, info, uciok, readyok)
- `types.ts`: TypeScript interfaces for UCI data structures

Communication flow:
1. Renderer requests engine selection via IPC
2. Main process shows file dialog, returns engine path
3. On game start, main process spawns engine as child process
4. Engine initialization: send `uci` → wait for `uciok` → send `isready` → wait for `readyok`
5. For each engine move: send `position` + `go movetime X` → parse `bestmove` response

### Game State Management

Game state lives in the **renderer process** (`ChessGame.ts`):
- `chess.js` instance: authoritative game state, move validation
- `chessground` instance: visual board representation, drag-and-drop UI
- Player makes move → validate with chess.js → update chessground → request engine move via IPC
- Engine responds → validate move → update chess.js → update chessground with animation

**Critical:** chessground requires three things to enable piece movement:
1. `turnColor`: whose turn it is
2. `movable.color`: which color can move
3. `movable.dests`: Map of legal move destinations (calculated from chess.js)

All three must be set correctly or pieces won't be draggable.

### IPC Communication Pattern

Main process uses `ipcMain.handle()` for async request/response:
- `engine:select` → returns engine file path
- `engine:move` → returns best move from engine
- `game:new` → initializes engine (MUST await this before requesting moves)

Renderer uses `ipcRenderer.invoke()` to call handlers and await responses.

The IPC bridge (`src/renderer/bridge/ipc.ts`) wraps the electronAPI for type safety.

## TypeScript Configuration

Two separate tsconfig files for different compilation targets:

**tsconfig.main.json**:
- Compiles main process, preload, and shared types
- Output: CommonJS modules to `dist/`
- Uses TypeScript compiler

**tsconfig.renderer.json**:
- Only used for type checking (not actual compilation)
- Renderer is bundled by esbuild (see package.json)
- Output: Single bundled file `dist/renderer/index.js`

## Key Implementation Details

### Renderer Bundling
The renderer MUST be bundled with esbuild because:
- Browser-based ES modules require explicit `.js` extensions in imports
- TypeScript doesn't add these extensions
- Bundling resolves all imports into a single file

### Preload Script Types
Type definitions in preload.ts are **inlined** (not imported) because:
- Preload runs in an isolated context
- Import resolution can fail at runtime
- Inlining avoids any module loading issues

### Engine Initialization Timing
The `game:new` IPC handler uses `ipcMain.handle` (not `ipcMain.on`) so the renderer can **await** engine initialization before requesting the first move. This prevents "Engine not initialized" errors.

### Legal Move Calculation
After every move (user or engine), must call `BoardRenderer.setMovableColor(ground, playerColor, chess)` with the chess.js instance to recalculate legal move destinations. Without this, chessground won't know where pieces can move.
