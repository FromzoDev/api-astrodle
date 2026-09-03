import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';
import { GuessSkyObjectStats } from './guess-sky-object-stats.entity';
import { DailyGameSchedule } from './daily-game-schedule.entity';
import { GuessSkyObjectGameRepository } from './guess-sky-object-game.repository';
import { GuessSkyObjectStatsRepository } from './guess-sky-object-stats.repository';
import { DailyGameScheduleRepository } from './daily-game-schedule.repository';
import { GuessSkyObjectService } from './guess-sky-object.service';
import { GuessSkyObjectSchedulerService } from './guess-sky-object-scheduler.service';
import { GuessSkyObjectController } from './guess-sky-object.controller';
import { SpaceSkyObjectModule } from '../spaceSkyObject/space-sky-object.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GuessSkyObjectGame,
      GuessSkyObjectStats,
      DailyGameSchedule,
    ]),
    SpaceSkyObjectModule,
  ],
  controllers: [GuessSkyObjectController],
  providers: [
    GuessSkyObjectService,
    GuessSkyObjectSchedulerService,
    GuessSkyObjectGameRepository,
    GuessSkyObjectStatsRepository,
    DailyGameScheduleRepository,
  ],
  exports: [
    GuessSkyObjectService,
    GuessSkyObjectGameRepository,
    GuessSkyObjectStatsRepository,
  ],
})
export class GuessSkyObjectModule {}
