import { EngineMoveRequest, EngineMoveResponse, GameConfig, EngineError } from '../../shared/types';

/**
 * Type-safe wrapper for IPC communication with main process
 */
export class IPCBridge {
  private api = window.electronAPI;

  /**
   * Open file dialog to select engine
   */
  async selectEngine(): Promise<string | null> {
    console.log('IPCBridge.selectEngine called');
    console.log('electronAPI available:', !!this.api);
    return this.api.selectEngine();
  }

  /**
   * Request the engine to calculate a move
   */
  async requestEngineMove(fen: string, moves?: string[]): Promise<EngineMoveResponse> {
    const request: EngineMoveRequest = { fen, moves };
    return this.api.requestEngineMove(request);
  }

  /**
   * Start a new game with the given configuration
   */
  async startNewGame(config: GameConfig): Promise<void> {
    await this.api.startNewGame(config);
  }

  /**
   * Listen for engine errors
   */
  onEngineError(callback: (error: EngineError) => void): () => void {
    return this.api.onEngineError(callback);
  }
}
