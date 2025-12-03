import { Api } from 'chessground/api';
import { Chess } from 'chess.js';
import { PlayerColor } from '../../shared/types';

export interface GameState {
  chess: Chess;
  ground: Api | null;
  enginePath: string | null;
  playerColor: PlayerColor;
  engineColor: PlayerColor;
  isEngineThinking: boolean;
  gameOver: boolean;
}

export type GameStatus = 'setup' | 'playing' | 'gameover';
