import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuessSkyObjectGameRepository } from './guess-sky-object-game.repository';
import { DailyGameScheduleRepository } from './daily-game-schedule.repository';

@Injectable()
export class GuessSkyObjectSchedulerService {
  private readonly logger = new Logger(GuessSkyObjectSchedulerService.name);

  constructor(
    private readonly guessSkyObjectGameRepository: GuessSkyObjectGameRepository,
    private readonly dailyGameScheduleRepository: DailyGameScheduleRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async planTodaysGame(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const existing = await this.dailyGameScheduleRepository.findByDate(today);
    if (existing) {
      this.logger.log(`Daily du ${today} déjà planifié`);
      return;
    }

    const game = await this.guessSkyObjectGameRepository.planTodaysGame(today);

    if (game) {
      this.logger.log(`Daily du ${today} planifié : objet id=${game.spaceSkyObject.id}`);
    } else {
      this.logger.warn(`Impossible de planifier le Daily du ${today} — aucun objet activé`);
    }
  }
}