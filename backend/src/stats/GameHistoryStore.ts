import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface GameRecord {
  gameId: string;
  roomId: string;
  timestamp: string;
  players: string[];
  playerNames: Record<string, string>;
  winnerId: string;
  loserId: string;
  endReason: 'dobon' | 'return_dobon' | 'burst' | 'penalty';
  multiplier: number;
  baseRate: number;
  payments: {
    payerId: string;
    payeeId: string;
    amount: number;
  }[];
}

export class GameHistoryStore {
  private filePath: string;
  private records: GameRecord[] = [];

  constructor() {
    this.filePath = path.resolve(__dirname, '../../data/game-history.json');
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.records = JSON.parse(data);
        logger.info('Game history loaded', { count: this.records.length });
      }
    } catch (error) {
      logger.warn('Failed to load game history, starting fresh', { error: (error as Error).message });
      this.records = [];
    }
  }

  private saveToFile(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save game history', { error: (error as Error).message });
    }
  }

  saveRecord(record: GameRecord): void {
    this.records.push(record);
    this.saveToFile();
    logger.info('Game record saved', { gameId: record.gameId, winner: record.winnerId });
  }

  getAllRecords(): GameRecord[] {
    return this.records;
  }

  getRecordsByPlayer(playerId: string): GameRecord[] {
    return this.records.filter(r => r.players.includes(playerId));
  }

  getRecordsByRoom(roomId: string): GameRecord[] {
    return this.records.filter(r => r.roomId === roomId);
  }
}
