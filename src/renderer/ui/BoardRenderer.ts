import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { Chess } from 'chess.js';
import { PlayerColor } from '../../shared/types';

export class BoardRenderer {
  /**
   * Initialize chessground on the given element
   */
  static initialize(element: HTMLElement, config: Partial<Config> = {}): Api {
    const defaultConfig: Partial<Config> = {
      movable: {
        free: false,
        color: 'white',
      },
      draggable: {
        enabled: true,
        showGhost: true,
      },
      highlight: {
        lastMove: true,
        check: true,
      },
      animation: {
        enabled: true,
        duration: 200,
      },
      ...config,
    };

    return Chessground(element, defaultConfig);
  }

  /**
   * Calculate legal move destinations from chess.js
   */
  static toDests(chess: Chess): Map<string, string[]> {
    const dests = new Map();
    const moves = chess.moves({ verbose: true });

    console.log('Calculating legal moves. Total moves available:', moves.length);
    console.log('Current turn:', chess.turn());
    console.log('FEN:', chess.fen());

    for (const move of moves) {
      const from = move.from;
      if (!dests.has(from)) {
        dests.set(from, []);
      }
      dests.get(from).push(move.to);
    }

    console.log('Legal move destinations:', dests);
    return dests;
  }

  /**
   * Update board orientation based on player color
   */
  static setOrientation(ground: Api, playerColor: PlayerColor): void {
    ground.set({
      orientation: playerColor,
    });
  }

  /**
   * Set which color can move pieces and update legal destinations
   */
  static setMovableColor(ground: Api, color: 'white' | 'black' | 'both' | undefined, chess?: Chess): void {
    console.log('setMovableColor called with color:', color, 'chess provided:', !!chess);

    const config: Partial<Config> = {
      turnColor: color === 'both' ? 'white' : color,
      movable: {
        color,
        free: false,
      },
    };

    // If chess instance provided, calculate legal move destinations
    if (chess) {
      config.movable!.dests = this.toDests(chess);
    }

    console.log('Setting ground config:', config);
    ground.set(config);
    console.log('Ground config updated. Current state:', {
      turnColor: config.turnColor,
      movableColor: config.movable?.color,
      destsCount: config.movable?.dests?.size || 0
    });
  }

  /**
   * Update board position from FEN
   */
  static setPosition(ground: Api, fen: string): void {
    ground.set({
      fen,
    });
  }

  /**
   * Make a move on the board with animation
   */
  static makeMove(ground: Api, from: string, to: string): void {
    ground.move(from as any, to as any);
  }

  /**
   * Disable all piece movement
   */
  static disable(ground: Api): void {
    ground.set({
      movable: {
        color: undefined,
      },
    });
  }
}
