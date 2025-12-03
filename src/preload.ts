import { contextBridge, ipcRenderer } from 'electron';

// Inline types to avoid module resolution issues in preload
enum IPCChannel {
  ENGINE_SELECT = 'engine:select',
  ENGINE_SELECTED = 'engine:selected',
  ENGINE_MOVE = 'engine:move',
  ENGINE_BESTMOVE = 'engine:bestmove',
  ENGINE_ERROR = 'engine:error',
  GAME_NEW = 'game:new',
}

type PlayerColor = 'white' | 'black';

interface GameConfig {
  enginePath: string;
  playerColor: PlayerColor;
}

interface EngineMoveRequest {
  fen: string;
  moves?: string[];
}

interface EngineMoveResponse {
  move: string;
}

interface EngineError {
  message: string;
  details?: string;
}

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Engine selection
  selectEngine: () => ipcRenderer.invoke(IPCChannel.ENGINE_SELECT),

  // Request engine move
  requestEngineMove: (request: EngineMoveRequest) =>
    ipcRenderer.invoke(IPCChannel.ENGINE_MOVE, request),

  // Start new game
  startNewGame: (config: GameConfig) =>
    ipcRenderer.invoke(IPCChannel.GAME_NEW, config),

  // Listen for engine errors
  onEngineError: (callback: (error: EngineError) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, error: EngineError) => callback(error);
    ipcRenderer.on(IPCChannel.ENGINE_ERROR, subscription);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(IPCChannel.ENGINE_ERROR, subscription);
    };
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  selectEngine: () => Promise<string | null>;
  requestEngineMove: (request: EngineMoveRequest) => Promise<EngineMoveResponse>;
  startNewGame: (config: GameConfig) => Promise<{ success: boolean }>;
  onEngineError: (callback: (error: EngineError) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
