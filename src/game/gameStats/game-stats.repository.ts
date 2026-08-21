import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameStats } from './game-stats.entity';
import { GameType } from '../../common/enum/game-type.enum';
import { GameMode } from '../../common/enum/game-mode.enum';

@Injectable()
export class GameStatsRepository {
  constructor(
    @InjectRepository(GameStats)
    private readonly gameStatsRepository: Repository<GameStats>,
  ) {}

  async findByGameTypeAndMode(gameType: GameType, mode: GameMode): Promise<GameStats | null> {
    return this.gameStatsRepository.findOneBy({ gameType, mode });
  }

  async incrementCounters(gameType: GameType, mode: GameMode, won: boolean): Promise<void> {
    let stats = await this.findByGameTypeAndMode(gameType, mode);

    if (!stats) {
      stats = await this.gameStatsRepository.save(
        this.gameStatsRepository.create({ gameType, mode }),
      );
    }

    const totalPlayed = stats.totalPlayed + 1;
    const totalWon = stats.totalWon + (won ? 1 : 0);
    const totalLost = stats.totalLost + (won ? 0 : 1);

    await this.gameStatsRepository.update(
      { gameType, mode },
      {
        totalPlayed,
        totalWon,
        totalLost,
        winRate: Math.round((totalWon / totalPlayed) * 100 * 100) / 100,
      },
    );
  }

  async incrementAbandoned(gameType: GameType, mode: GameMode): Promise<void> {
    let stats = await this.findByGameTypeAndMode(gameType, mode);

    if (!stats) {
      stats = await this.gameStatsRepository.save(this.gameStatsRepository.create({ gameType, mode }));
    }

    await this.gameStatsRepository.increment({ gameType, mode }, 'totalAbandoned', 1);
  }
}