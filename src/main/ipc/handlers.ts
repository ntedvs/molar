import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPCChannel, EngineMoveRequest, EngineMoveResponse, GameConfig } from '../../shared/types';
import { UCIEngine } from '../uci/UCIEngine';
import * as fs from 'fs';

let currentEngine: UCIEngine | null = null;

/**
 * Set up all IPC handlers
 */
export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  // Handle engine selection
  ipcMain.handle(IPCChannel.ENGINE_SELECT, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select UCI Chess Engine',
      buttonLabel: 'Select Engine',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const enginePath = result.filePaths[0];

    // Verify the file exists and is executable
    try {
      const stats = fs.statSync(enginePath);
      if (!stats.isFile()) {
        throw new Error('Selected path is not a file');
      }
    } catch (err) {
      console.error('Invalid engine path:', err);
      return null;
    }

    return enginePath;
  });

  // Handle engine move request
  ipcMain.handle(IPCChannel.ENGINE_MOVE, async (_event, request: EngineMoveRequest) => {
    if (!currentEngine || !currentEngine.isReady()) {
      throw new Error('Engine not initialized');
    }

    try {
      // Set position
      currentEngine.setPosition(request.fen, request.moves);

      // Get best move
      const move = await currentEngine.getBestMove(1000);

      const response: EngineMoveResponse = { move };
      return response;
    } catch (err) {
      console.error('Error getting engine move:', err);
      mainWindow.webContents.send(IPCChannel.ENGINE_ERROR, {
        message: 'Failed to get engine move',
        details: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  });

  // Handle new game - changed to handle instead of on so we can return when ready
  ipcMain.handle(IPCChannel.GAME_NEW, async (_event, config: GameConfig) => {
    console.log('Starting new game with config:', config);

    // Clean up old engine if exists
    if (currentEngine) {
      currentEngine.quit();
      currentEngine = null;
    }

    try {
      // Create new engine instance
      currentEngine = new UCIEngine(config.enginePath);

      // Initialize engine
      await currentEngine.initialize();

      console.log('Engine initialized successfully');
      return { success: true };
    } catch (err) {
      console.error('Failed to initialize engine:', err);
      mainWindow.webContents.send(IPCChannel.ENGINE_ERROR, {
        message: 'Failed to initialize engine',
        details: err instanceof Error ? err.message : String(err),
      });
      currentEngine = null;
      throw err;
    }
  });
}

/**
 * Clean up engine on app quit
 */
export function cleanupEngine(): void {
  if (currentEngine) {
    currentEngine.quit();
    currentEngine = null;
  }
}
