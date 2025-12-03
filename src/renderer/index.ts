import { IPCBridge } from './bridge/ipc';
import { GameSetup } from './ui/GameSetup';
import { Controls } from './ui/Controls';
import { ChessGame } from './game/ChessGame';
import { GameConfig } from '../shared/types';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Molar Chess GUI starting...');

  // Initialize IPC bridge
  const ipc = new IPCBridge();

  // Get board element
  const boardElement = document.getElementById('board')!;

  // Initialize game
  const game = new ChessGame(boardElement, ipc, (status) => {
    controls.setStatus(status);
  });

  // Initialize controls
  const controls = new Controls(() => {
    // New game button clicked
    controls.hide();
    gameSetup.reset();
    gameSetup.show();
  });

  // Initialize game setup
  const gameSetup = new GameSetup(ipc, async (config: GameConfig) => {
    console.log('Starting game with config:', config);

    // Hide setup, show game
    gameSetup.hide();
    controls.show();

    // Start the game
    await game.startGame(config);
  });

  // Show initial setup
  controls.hide();
  gameSetup.show();

  console.log('Molar Chess GUI initialized');
});
