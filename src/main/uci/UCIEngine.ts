import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { UCIParser } from './parser';
import { UCIInfo, UCIBestMove } from './types';

export class UCIEngine extends EventEmitter {
  private process: ChildProcess | null = null;
  private ready: boolean = false;
  private buffer: string = '';
  private pendingBestMove: ((move: string) => void) | null = null;
  private bestMoveTimeout: NodeJS.Timeout | null = null;

  constructor(private enginePath: string) {
    super();
  }

  /**
   * Initialize the UCI engine
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Spawn the engine process
        this.process = spawn(this.enginePath);

        if (!this.process.stdout || !this.process.stdin) {
          reject(new Error('Failed to create engine process streams'));
          return;
        }

        // Handle stdout data
        this.process.stdout.on('data', (data: Buffer) => {
          this.buffer += data.toString();
          const lines = this.buffer.split('\n');
          this.buffer = lines.pop() || '';

          for (const line of lines) {
            this.handleEngineOutput(line.trim());
          }
        });

        // Handle stderr
        this.process.stderr?.on('data', (data: Buffer) => {
          console.error('Engine stderr:', data.toString());
        });

        // Handle process exit
        this.process.on('exit', (code) => {
          console.log(`Engine process exited with code ${code}`);
          this.ready = false;
          this.emit('exit', code);
        });

        // Handle process error
        this.process.on('error', (err) => {
          console.error('Engine process error:', err);
          this.emit('error', err);
          reject(err);
        });

        // Wait for uciok, then send isready
        const uciokListener = () => {
          console.log('Received uciok event');
          this.removeListener('uciok', uciokListener);
          this.sendCommand('isready');

          const readyListener = () => {
            console.log('Received readyok event');
            this.removeListener('readyok', readyListener);
            this.ready = true;
            resolve();
          };

          this.on('readyok', readyListener);
        };

        this.on('uciok', uciokListener);

        // Send uci command to initialize
        this.sendCommand('uci');

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!this.ready) {
            reject(new Error('Engine initialization timeout'));
          }
        }, 30000);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send a command to the engine
   */
  private sendCommand(command: string): void {
    if (!this.process || !this.process.stdin) {
      console.error('Engine process not available');
      return;
    }

    console.log('Sending to engine:', command);
    this.process.stdin.write(command + '\n');
  }

  /**
   * Handle output from the engine
   */
  private handleEngineOutput(line: string): void {
    if (!line) return;

    console.log('Engine output:', line);

    // Check for uciok
    if (UCIParser.isUciOk(line)) {
      this.emit('uciok');
      return;
    }

    // Check for readyok
    if (UCIParser.isReadyOk(line)) {
      this.emit('readyok');
      return;
    }

    // Parse bestmove
    const bestmove = UCIParser.parseBestMove(line);
    if (bestmove) {
      this.emit('bestmove', bestmove);

      // Clear timeout
      if (this.bestMoveTimeout) {
        clearTimeout(this.bestMoveTimeout);
        this.bestMoveTimeout = null;
      }

      // Resolve pending promise
      if (this.pendingBestMove) {
        this.pendingBestMove(bestmove.move);
        this.pendingBestMove = null;
      }
      return;
    }

    // Parse info
    const info = UCIParser.parseInfo(line);
    if (info) {
      this.emit('info', info);
      return;
    }
  }

  /**
   * Set the current position
   */
  setPosition(fen?: string, moves?: string[]): void {
    if (!this.ready) {
      throw new Error('Engine not ready');
    }

    let command = 'position ';

    if (fen) {
      command += `fen ${fen}`;
    } else {
      command += 'startpos';
    }

    if (moves && moves.length > 0) {
      command += ' moves ' + moves.join(' ');
    }

    this.sendCommand(command);
  }

  /**
   * Request the engine to calculate the best move
   */
  async getBestMove(timeMs: number = 1000): Promise<string> {
    if (!this.ready) {
      throw new Error('Engine not ready');
    }

    return new Promise((resolve, reject) => {
      this.pendingBestMove = resolve;

      // Set timeout
      this.bestMoveTimeout = setTimeout(() => {
        this.pendingBestMove = null;
        reject(new Error('Engine bestmove timeout'));
      }, timeMs + 30000); // Add 30 seconds buffer to the requested time

      // Send go command
      this.sendCommand(`go movetime ${timeMs}`);
    });
  }

  /**
   * Stop the engine calculation
   */
  stop(): void {
    if (this.ready) {
      this.sendCommand('stop');
    }
  }

  /**
   * Quit the engine
   */
  quit(): void {
    if (this.process) {
      this.sendCommand('quit');

      // Force kill after 5 seconds if not exited
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill();
        }
      }, 5000);
    }
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.ready;
  }
}
