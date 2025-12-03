import { IPCBridge } from '../bridge/ipc';
import { PlayerColor, GameConfig } from '../../shared/types';

export class GameSetup {
  private enginePath: string | null = null;
  private playerColor: PlayerColor = 'white';
  private ipc: IPCBridge;

  private setupModal: HTMLElement;
  private selectEngineBtn: HTMLButtonElement;
  private enginePathDisplay: HTMLElement;
  private whiteRadio: HTMLInputElement;
  private blackRadio: HTMLInputElement;
  private startGameBtn: HTMLButtonElement;

  constructor(ipc: IPCBridge, onStartGame: (config: GameConfig) => void) {
    this.ipc = ipc;

    // Get DOM elements
    this.setupModal = document.getElementById('setup-modal')!;
    this.selectEngineBtn = document.getElementById('select-engine-btn') as HTMLButtonElement;
    this.enginePathDisplay = document.getElementById('engine-path')!;
    this.whiteRadio = document.getElementById('color-white') as HTMLInputElement;
    this.blackRadio = document.getElementById('color-black') as HTMLInputElement;
    this.startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;

    // Set up event listeners
    this.selectEngineBtn.addEventListener('click', async () => {
      await this.selectEngine();
    });

    this.whiteRadio.addEventListener('change', () => {
      if (this.whiteRadio.checked) {
        this.playerColor = 'white';
        this.updateStartButton();
      }
    });

    this.blackRadio.addEventListener('change', () => {
      if (this.blackRadio.checked) {
        this.playerColor = 'black';
        this.updateStartButton();
      }
    });

    this.startGameBtn.addEventListener('click', () => {
      if (this.enginePath) {
        const config: GameConfig = {
          enginePath: this.enginePath,
          playerColor: this.playerColor,
        };
        onStartGame(config);
      }
    });

    // Initial state
    this.updateStartButton();
  }

  private async selectEngine(): Promise<void> {
    console.log('Select engine button clicked');
    try {
      const path = await this.ipc.selectEngine();
      console.log('Engine path selected:', path);

      if (path) {
        this.enginePath = path;
        this.enginePathDisplay.textContent = path;
        this.updateStartButton();
      }
    } catch (err) {
      console.error('Error selecting engine:', err);
    }
  }

  private updateStartButton(): void {
    this.startGameBtn.disabled = !this.enginePath;
  }

  show(): void {
    this.setupModal.style.display = 'flex';
  }

  hide(): void {
    this.setupModal.style.display = 'none';
  }

  reset(): void {
    this.enginePath = null;
    this.enginePathDisplay.textContent = 'No engine selected';
    this.playerColor = 'white';
    this.whiteRadio.checked = true;
    this.updateStartButton();
  }
}
