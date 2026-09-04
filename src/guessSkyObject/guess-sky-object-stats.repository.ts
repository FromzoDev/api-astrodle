import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuessSkyObjectStats } from './guess-sky-object-stats.entity';
import { GameMode } from '../common/enum/game-mode.enum';

@Injectable()
export class GuessSkyObjectStatsRepository {
  constructor(
    @InjectRepository(GuessSkyObjectStats)
    private readonly repository: Repository<GuessSkyObjectStats>,
  ) {}

  async findByMode(mode: GameMode): Promise<GuessSkyObjectStats | null> {
    return this.repository.findOneBy({ mode });
  }

  async incrementOnFinish(
    mode: GameMode,
    attemptsUsed: number,
    won: boolean,
  ): Promise<void> {
    let stats = await this.findByMode(mode);

    if (!stats) {
      stats = await this.repository.save(this.repository.create({ mode }));
    }

    const totalPlayed = stats.totalPlayed + 1;
    const totalAttemptsSum =
      stats.avgAttemptsUsed * stats.totalPlayed + attemptsUsed;

    const winCountByAttemptNumber = { ...stats.winCountByAttemptNumber };
    if (won) {
      winCountByAttemptNumber[attemptsUsed] =
        (winCountByAttemptNumber[attemptsUsed] ?? 0) + 1;
    }

    await this.repository.update(
      { mode },
      {
        totalPlayed,
        avgAttemptsUsed:
          Math.round((totalAttemptsSum / totalPlayed) * 100) / 100,
        winCountByAttemptNumber,
      },
    );
  }
}
