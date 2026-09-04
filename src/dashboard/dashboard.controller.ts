import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import {
  DashboardStatsService,
  GameOverviewEntry,
} from './dashboard-stats.service';
import { GameMode } from '../common/enum/game-mode.enum';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiResponse } from '../common/interfaces/response.interface';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Auth(Role.Admin)
  @Get('games-overview')
  async getGamesOverview(
    @Query('mode') mode: GameMode,
  ): Promise<ApiResponse<GameOverviewEntry[]>> {
    const data = await this.dashboardStatsService.getAllGamesOverview(mode);
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.GAMES_OVERVIEW_FETCHED,
      data,
    };
  }
}
