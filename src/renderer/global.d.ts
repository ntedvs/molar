import { EngineMoveRequest, EngineMoveResponse, GameConfig, EngineError } from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      selectEngine: () => Promise<string | null>;
      requestEngineMove: (request: EngineMoveRequest) => Promise<EngineMoveResponse>;
      startNewGame: (config: GameConfig) => void;
      onEngineError: (callback: (error: EngineError) => void) => () => void;
    };
  }
}

export {};
