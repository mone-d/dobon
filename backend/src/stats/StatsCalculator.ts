import { GameHistoryStore, GameRecord } from './GameHistoryStore';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarned: number;
  totalPaid: number;
  netBalance: number;
  maxMultiplier: number;
}

export interface RoomBalanceEntry {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  totalAmount: number;
}

export class StatsCalculator {
  constructor(private store: GameHistoryStore) {}

  getPlayerStats(playerId: string): PlayerStats {
    const records = this.store.getRecordsByPlayer(playerId);

    let playerName = '';
    let wins = 0;
    let losses = 0;
    let totalEarned = 0;
    let totalPaid = 0;
    let maxMultiplier = 0;

    for (const record of records) {
      // 名前を最新のものに更新
      if (record.playerNames[playerId]) {
        playerName = record.playerNames[playerId];
      }

      // 勝敗
      if (record.winnerId === playerId) {
        wins++;
      }
      if (record.loserId === playerId) {
        losses++;
      }

      // 収支
      for (const payment of record.payments) {
        if (payment.payeeId === playerId) {
          totalEarned += payment.amount;
        }
        if (payment.payerId === playerId) {
          totalPaid += payment.amount;
        }
      }

      // 最高倍率（自分が関与したゲーム）
      if (record.multiplier > maxMultiplier) {
        maxMultiplier = record.multiplier;
      }
    }

    const totalGames = records.length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;

    return {
      playerId,
      playerName,
      totalGames,
      wins,
      losses,
      winRate,
      totalEarned,
      totalPaid,
      netBalance: totalEarned - totalPaid,
      maxMultiplier,
    };
  }

  getRoomBalance(roomId: string): RoomBalanceEntry[] {
    const records = this.store.getRecordsByRoom(roomId);
    
    // プレイヤー間の累計支払いを集計
    const balanceMap = new Map<string, { amount: number; fromName: string; toName: string }>();

    for (const record of records) {
      for (const payment of record.payments) {
        const key = `${payment.payerId}→${payment.payeeId}`;
        const existing = balanceMap.get(key);
        if (existing) {
          existing.amount += payment.amount;
          // 名前を最新に更新
          existing.fromName = record.playerNames[payment.payerId] || existing.fromName;
          existing.toName = record.playerNames[payment.payeeId] || existing.toName;
        } else {
          balanceMap.set(key, {
            amount: payment.amount,
            fromName: record.playerNames[payment.payerId] || payment.payerId,
            toName: record.playerNames[payment.payeeId] || payment.payeeId,
          });
        }
      }
    }

    const entries: RoomBalanceEntry[] = [];
    for (const [key, value] of balanceMap.entries()) {
      const [fromId, toId] = key.split('→');
      entries.push({
        fromPlayerId: fromId,
        fromPlayerName: value.fromName,
        toPlayerId: toId,
        toPlayerName: value.toName,
        totalAmount: value.amount,
      });
    }

    return entries;
  }

  getRanking(): PlayerStats[] {
    const allRecords = this.store.getAllRecords();
    const playerIds = new Set<string>();

    for (const record of allRecords) {
      for (const pid of record.players) {
        playerIds.add(pid);
      }
    }

    const stats = Array.from(playerIds).map(pid => this.getPlayerStats(pid));
    stats.sort((a, b) => b.netBalance - a.netBalance);

    return stats;
  }
}
