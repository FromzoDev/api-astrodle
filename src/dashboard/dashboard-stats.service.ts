import { Injectable } from '@nestjs/common';
import { GuessSkyObjectService } from '../guessSkyObject/guess-sky-object.service';
import { GameType } from '../common/enum/game-type.enum';
import { GameMode } from '../common/enum/game-mode.enum';

export interface GameOverviewEntry {
  gameType: GameType;
  stats: Record<string, any>;
}

@Injectable()
export class DashboardStatsService {
  constructor(private readonly guessSkyObjectService: GuessSkyObjectService) {}

  async getAllGamesOverview(mode: GameMode): Promise<GameOverviewEntry[]> {
    const results = await Promise.all([
      this.buildEntry(GameType.GuessSkyObject, mode),
    ]);

    return results;
  }

  private async buildEntry(
    gameType: GameType,
    mode: GameMode,
  ): Promise<GameOverviewEntry> {
    switch (gameType) {
      case GameType.GuessSkyObject:
        return {
          gameType,
          stats: await this.guessSkyObjectService.getGlobalStats(mode),
        };
      default:
        return { gameType, stats: {} };
    }
  }
}
