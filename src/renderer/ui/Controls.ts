export class Controls {
  private newGameBtn: HTMLButtonElement;
  private statusText: HTMLElement;

  constructor(onNewGame: () => void) {
    // Get DOM elements
    this.newGameBtn = document.getElementById('new-game-btn') as HTMLButtonElement;
    this.statusText = document.getElementById('game-status')!;

    // Set up event listeners
    this.newGameBtn.addEventListener('click', () => {
      onNewGame();
    });
  }

  setStatus(status: string): void {
    this.statusText.textContent = status;
  }

  setNewGameEnabled(enabled: boolean): void {
    this.newGameBtn.disabled = !enabled;
  }

  show(): void {
    this.newGameBtn.style.display = 'inline-block';
  }

  hide(): void {
    this.newGameBtn.style.display = 'none';
  }
}
