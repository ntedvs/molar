// Shared types between main and renderer processes

export enum IPCChannel {
  ENGINE_SELECT = 'engine:select',
  ENGINE_SELECTED = 'engine:selected',
  ENGINE_MOVE = 'engine:move',
  ENGINE_BESTMOVE = 'engine:bestmove',
  ENGINE_ERROR = 'engine:error',
  GAME_NEW = 'game:new',
}

export type PlayerColor = 'white' | 'black';

export interface GameConfig {
  enginePath: string;
  playerColor: PlayerColor;
}

export interface EngineMoveRequest {
  fen: string;
  moves?: string[];
}

export interface EngineMoveResponse {
  move: string;  // UCI format (e.g., 'e2e4', 'e7e8q')
}

export interface EngineError {
  message: string;
  details?: string;
}
