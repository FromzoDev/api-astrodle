import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardStatsService } from './dashboard-stats.service';
import { GuessSkyObjectModule } from '../guessSkyObject/guess-sky-object.module';

@Module({
  imports: [GuessSkyObjectModule],
  controllers: [DashboardController],
  providers: [DashboardStatsService],
})
export class DashboardModule {}