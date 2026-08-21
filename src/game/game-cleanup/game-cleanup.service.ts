import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameSessionRepository } from '../gameSession/game-session.repository';
import { GameStatsRepository } from '../gameStats/game-stats.repository';
import { GameType } from '../../common/enum/game-type.enum';
import { GuessSkyObjectGameRepository } from '../../guessSkyObject/guess-sky-object-game.repository';

@Injectable()
export class GameCleanupService {
  private readonly logger = new Logger(GameCleanupService.name);

  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly gameStatsRepository: GameStatsRepository,
    private readonly guessSkyObjectGameRepository: GuessSkyObjectGameRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupAbandonedSessions(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const sessions = await this.gameSessionRepository.findAbandonableSessions(cutoffDate);

    if (sessions.length === 0) {
      return;
    }

    const sessionIds = sessions.map((s) => s.id);
    await this.gameSessionRepository.abandonSessions(sessionIds);

    for (const session of sessions) {
      await this.gameStatsRepository.incrementAbandoned(session.gameType, session.mode);
      await this.incrementContentAbandoned(session.gameType, session.contentId);
    }

    this.logger.log(`${sessions.length} session(s) marquée(s) comme abandonnée(s)`);
  }

  private async incrementContentAbandoned(gameType: GameType, contentId: number): Promise<void> {
    switch (gameType) {
      case GameType.GuessSkyObject: {
        const game = await this.guessSkyObjectGameRepository.findBySpaceSkyObjectId(contentId);
        if (game) {
          await this.guessSkyObjectGameRepository.incrementAbandoned(game.id);
        }
        break;
      }
    }
  }
}