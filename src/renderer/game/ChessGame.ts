import { Chess } from 'chess.js';
import { Api } from 'chessground/api';
import { Key } from 'chessground/types';
import { GameState } from './types';
import { GameConfig, PlayerColor } from '../../shared/types';
import { IPCBridge } from '../bridge/ipc';
import { BoardRenderer } from '../ui/BoardRenderer';

export class ChessGame {
  private state: GameState;
  private ipc: IPCBridge;
  private onStatusChange: (status: string) => void;

  constructor(
    boardElement: HTMLElement,
    ipc: IPCBridge,
    onStatusChange: (status: string) => void
  ) {
    this.ipc = ipc;
    this.onStatusChange = onStatusChange;

    // Initialize state
    this.state = {
      chess: new Chess(),
      ground: null,
      enginePath: null,
      playerColor: 'white',
      engineColor: 'black',
      isEngineThinking: false,
      gameOver: false,
    };

    // Initialize chessground
    this.state.ground = BoardRenderer.initialize(boardElement, {
      movable: {
        events: {
          after: (orig, dest) => this.onUserMove(orig, dest),
        },
      },
    });

    // Listen for engine errors
    this.ipc.onEngineError((error) => {
      this.onStatusChange(`Engine error: ${error.message}`);
      this.state.isEngineThinking = false;
    });
  }

  /**
   * Start a new game with the given configuration
   */
  async startGame(config: GameConfig): Promise<void> {
    // Reset game state
    this.state.chess.reset();
    this.state.enginePath = config.enginePath;
    this.state.playerColor = config.playerColor;
    this.state.engineColor = config.playerColor === 'white' ? 'black' : 'white';
    this.state.gameOver = false;
    this.state.isEngineThinking = false;

    if (!this.state.ground) return;

    // Update board
    BoardRenderer.setPosition(this.state.ground, this.state.chess.fen());
    BoardRenderer.setOrientation(this.state.ground, this.state.playerColor);
    BoardRenderer.setMovableColor(this.state.ground, this.state.playerColor, this.state.chess);

    // Notify main process and wait for engine to initialize
    await this.ipc.startNewGame(config);

    this.onStatusChange('Game started');

    // If engine plays first, request move
    if (this.state.engineColor === 'white') {
      await this.requestEngineMove();
    }
  }

  /**
   * Handle user move
   */
  private async onUserMove(from: Key, to: Key): Promise<void> {
    if (this.state.gameOver || this.state.isEngineThinking || !this.state.ground) {
      return;
    }

    // Try to make the move
    try {
      const move = this.state.chess.move({
        from,
        to,
        promotion: 'q', // Always promote to queen for simplicity
      });

      if (!move) {
        // Illegal move, revert board
        BoardRenderer.setPosition(this.state.ground, this.state.chess.fen());
        return;
      }

      // Update board with the new position
      BoardRenderer.setPosition(this.state.ground, this.state.chess.fen());

      // Check game over
      if (this.checkGameOver()) {
        return;
      }

      // Request engine move
      await this.requestEngineMove();
    } catch (err) {
      console.error('Error making move:', err);
      // Revert board on error
      BoardRenderer.setPosition(this.state.ground, this.state.chess.fen());
    }
  }

  /**
   * Request engine to calculate and make a move
   */
  private async requestEngineMove(): Promise<void> {
    console.log('=== requestEngineMove called ===');
    console.log('Ground exists:', !!this.state.ground);
    console.log('Game over:', this.state.gameOver);

    if (!this.state.ground || this.state.gameOver) return;

    this.state.isEngineThinking = true;
    this.onStatusChange('Engine thinking...');

    // Disable user moves while engine thinks
    console.log('Disabling user moves while engine thinks');
    BoardRenderer.setMovableColor(this.state.ground, undefined);

    try {
      // Request engine move
      console.log('Requesting engine move for FEN:', this.state.chess.fen());
      const response = await this.ipc.requestEngineMove(this.state.chess.fen());
      console.log('Engine responded with move:', response.move);

      // Parse UCI move (e.g., "e2e4" or "e7e8q")
      const from = response.move.substring(0, 2);
      const to = response.move.substring(2, 4);
      const promotion = response.move.length > 4 ? response.move[4] : undefined;

      console.log('Parsed move - from:', from, 'to:', to, 'promotion:', promotion);

      // Make the move
      const move = this.state.chess.move({
        from,
        to,
        promotion: promotion as any,
      });

      if (!move) {
        console.error('Invalid engine move:', response.move);
        this.onStatusChange('Error: Invalid engine move');
        return;
      }

      console.log('Move applied to chess.js:', move);
      console.log('New FEN:', this.state.chess.fen());
      console.log('Turn after move:', this.state.chess.turn());

      // Update board with animation
      console.log('Updating board with animation');
      BoardRenderer.makeMove(this.state.ground, from, to);
      BoardRenderer.setPosition(this.state.ground, this.state.chess.fen());

      // Check game over
      console.log('Checking if game is over');
      if (!this.checkGameOver()) {
        console.log('Game not over, re-enabling user moves');
        console.log('Player color:', this.state.playerColor);
        console.log('Current chess.js turn:', this.state.chess.turn());

        // Re-enable user moves with updated legal move destinations
        BoardRenderer.setMovableColor(this.state.ground, this.state.playerColor, this.state.chess);
        this.onStatusChange('Your turn');
        console.log('User moves re-enabled');
      } else {
        console.log('Game is over');
      }
    } catch (err) {
      console.error('Error getting engine move:', err);
      this.onStatusChange('Error getting engine move');
    } finally {
      this.state.isEngineThinking = false;
      console.log('=== requestEngineMove completed ===');
    }
  }

  /**
   * Check if game is over
   */
  private checkGameOver(): boolean {
    if (this.state.chess.isGameOver()) {
      this.state.gameOver = true;

      let status = 'Game over: ';
      if (this.state.chess.isCheckmate()) {
        const winner = this.state.chess.turn() === 'w' ? 'Black' : 'White';
        status += `${winner} wins by checkmate!`;
      } else if (this.state.chess.isDraw()) {
        if (this.state.chess.isStalemate()) {
          status += 'Draw by stalemate';
        } else if (this.state.chess.isThreefoldRepetition()) {
          status += 'Draw by threefold repetition';
        } else if (this.state.chess.isInsufficientMaterial()) {
          status += 'Draw by insufficient material';
        } else {
          status += 'Draw';
        }
      }

      this.onStatusChange(status);

      // Disable all moves
      if (this.state.ground) {
        BoardRenderer.disable(this.state.ground);
      }

      return true;
    }

    return false;
  }
}
