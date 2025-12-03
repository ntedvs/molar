import { UCIInfo, UCIBestMove } from './types';

export class UCIParser {
  /**
   * Parse a bestmove line from UCI output
   * Format: "bestmove e2e4" or "bestmove e2e4 ponder e7e5"
   */
  static parseBestMove(line: string): UCIBestMove | null {
    const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)(?:\s+ponder\s+([a-h][1-8][a-h][1-8][qrbn]?))?/);
    if (!match) return null;

    return {
      move: match[1],
      ponder: match[2],
    };
  }

  /**
   * Parse an info line from UCI output
   * Format: "info depth 12 seldepth 18 score cp 34 nodes 1234 nps 5000 time 247 pv e2e4 e7e5"
   */
  static parseInfo(line: string): UCIInfo | null {
    if (!line.startsWith('info ')) return null;

    const info: UCIInfo = {};

    // Parse depth
    const depthMatch = line.match(/\bdepth\s+(\d+)/);
    if (depthMatch) info.depth = parseInt(depthMatch[1]);

    // Parse selective depth
    const seldepthMatch = line.match(/\bseldepth\s+(\d+)/);
    if (seldepthMatch) info.seldepth = parseInt(seldepthMatch[1]);

    // Parse score (centipawns or mate)
    const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
    const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);

    if (cpMatch) {
      info.score = {
        type: 'cp',
        value: parseInt(cpMatch[1]),
      };
    } else if (mateMatch) {
      info.score = {
        type: 'mate',
        value: parseInt(mateMatch[1]),
      };
    }

    // Parse nodes
    const nodesMatch = line.match(/\bnodes\s+(\d+)/);
    if (nodesMatch) info.nodes = parseInt(nodesMatch[1]);

    // Parse nps (nodes per second)
    const npsMatch = line.match(/\bnps\s+(\d+)/);
    if (npsMatch) info.nps = parseInt(npsMatch[1]);

    // Parse time (in milliseconds)
    const timeMatch = line.match(/\btime\s+(\d+)/);
    if (timeMatch) info.time = parseInt(timeMatch[1]);

    // Parse multipv
    const multipvMatch = line.match(/\bmultipv\s+(\d+)/);
    if (multipvMatch) info.multipv = parseInt(multipvMatch[1]);

    // Parse current move
    const currmoveMatch = line.match(/\bcurrmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
    if (currmoveMatch) info.currmove = currmoveMatch[1];

    // Parse current move number
    const currmovenumberMatch = line.match(/\bcurrmovenumber\s+(\d+)/);
    if (currmovenumberMatch) info.currmovenumber = parseInt(currmovenumberMatch[1]);

    // Parse principal variation (PV)
    const pvMatch = line.match(/\bpv\s+(.+)$/);
    if (pvMatch) {
      info.pv = pvMatch[1].trim().split(/\s+/);
    }

    return Object.keys(info).length > 0 ? info : null;
  }

  /**
   * Check if a line is uciok
   */
  static isUciOk(line: string): boolean {
    return line.trim() === 'uciok';
  }

  /**
   * Check if a line is readyok
   */
  static isReadyOk(line: string): boolean {
    return line.trim() === 'readyok';
  }
}
