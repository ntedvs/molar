// UCI protocol types

export interface UCIOption {
  name: string;
  type: string;
  default?: string;
  min?: number;
  max?: number;
  vars?: string[];
}

export interface UCIEngineInfo {
  name: string;
  author: string;
  options: UCIOption[];
}

export interface UCIInfo {
  depth?: number;
  seldepth?: number;
  score?: {
    type: 'cp' | 'mate';
    value: number;
  };
  nodes?: number;
  nps?: number;
  time?: number;
  pv?: string[];
  multipv?: number;
  currmove?: string;
  currmovenumber?: number;
}

export interface UCIBestMove {
  move: string;
  ponder?: string;
}

export type UCIEngineEvent =
  | { type: 'ready' }
  | { type: 'info'; info: UCIInfo }
  | { type: 'bestmove'; bestmove: UCIBestMove }
  | { type: 'error'; error: Error };
