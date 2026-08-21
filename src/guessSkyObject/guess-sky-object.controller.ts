import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, UseGuards, HttpStatus, Patch } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { GuessSkyObjectService } from './guess-sky-object.service';
import { GuessSkyObjectGameRepository } from './guess-sky-object-game.repository';
import { DailyGameScheduleRepository } from './daily-game-schedule.repository';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';
import { DailyGameSchedule } from './daily-game-schedule.entity';
import { GameEnabledGuard } from '../common/guards/game-enabled.guard';
import { RequireGameEnabled } from '../common/decorators/require-game-enabled.decorator';
import { GameType } from '../common/enum/game-type.enum';
import { GameMode } from '../common/enum/game-mode.enum';
import { SuccessMessage } from '../common/enum/success.enum';
import { ErrorMessage } from '../common/enum/error.enum';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/response.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';
import { SubmitGuessDTO } from './DTO/submit-guess-dto';
import { CreateGuessSkyObjectGameDTO } from './DTO/create-guess-sky-object-game-dto';
import { UpdateGuessSkyObjectGameDTO } from './DTO/update-guess-sky-object-game-dto';
import { GuessSkyObjectGameQueryDto } from './DTO/guess-sky-object-game-query-dto';
import { DailyGameScheduleQueryDto } from './DTO/daily-game-schedule-query-dto';

@ApiBearerAuth('JWT-auth')
@Controller('guess-sky-object')
export class GuessSkyObjectController {
  constructor(
    private readonly gameService: GameService,
    private readonly guessSkyObjectService: GuessSkyObjectService,
    private readonly guessSkyObjectGameRepository: GuessSkyObjectGameRepository,
    private readonly dailyGameScheduleRepository: DailyGameScheduleRepository,
  ) {}

  @UseGuards(GameEnabledGuard)
  @RequireGameEnabled(GameType.GuessSkyObject, GameMode.Daily)
  @Post('daily/start')
  async startDaily(): Promise<ApiResponse<Record<string, any>>> {
    const session = await this.gameService.play(GameType.GuessSkyObject, GameMode.Daily, this.guessSkyObjectService);
    const view = await this.guessSkyObjectService.buildClientView(session);

    return {
      code: HttpStatus.CREATED,
      message: SuccessMessage.GAME_STARTED,
      data: { sessionId: session.id, ...view },
    };
  }

  @UseGuards(GameEnabledGuard)
  @RequireGameEnabled(GameType.GuessSkyObject, GameMode.Casual)
  @Post('casual/start')
  async startCasual(): Promise<ApiResponse<Record<string, any>>> {
    const session = await this.gameService.play(GameType.GuessSkyObject, GameMode.Casual, this.guessSkyObjectService);
    const view = await this.guessSkyObjectService.buildClientView(session);

    return {
      code: HttpStatus.CREATED,
      message: SuccessMessage.GAME_STARTED,
      data: { sessionId: session.id, ...view },
    };
  }

  @Post(':sessionId/guess')
  async guess(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitGuessDTO,
  ): Promise<ApiResponse<Record<string, any>>> {
    const session = await this.gameService.submitAction(
      sessionId,
      { guess: dto.guess },
      this.guessSkyObjectService,
    );
    const view = await this.guessSkyObjectService.buildClientView(session);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.GUESS_SUBMITTED,
      data: view,
    };
  }

  @Get('stats')
  async getGameStats(@Query('mode') mode: GameMode): Promise<ApiResponse<Record<string, any>>> {
    const data = await this.guessSkyObjectService.getGlobalStats(mode);
    return { code: HttpStatus.OK, message: SuccessMessage.GAME_STATS_FETCHED, data };
  }

  @Get(':spaceSkyObjectId/stats')
  async getObjectStats(
    @Param('spaceSkyObjectId', ParseIntPipe) spaceSkyObjectId: number,
  ): Promise<ApiResponse<GuessSkyObjectGame | null>> {
    const data = await this.guessSkyObjectGameRepository.findBySpaceSkyObjectId(spaceSkyObjectId);
    return { code: HttpStatus.OK, message: SuccessMessage.GAME_STATS_FETCHED, data };
  }

  @Auth(Role.Moderator)
  @Get('games')
  async getGamesPaginated(
    @Query() queryDto: GuessSkyObjectGameQueryDto,
  ): Promise<PaginatedApiResponse<GuessSkyObjectGame>> {
    const result = await this.guessSkyObjectGameRepository.findPaginated(queryDto);
    return {
      code: HttpStatus.OK,
      message: result.items.length > 0 ? SuccessMessage.GUESS_SKY_OBJECT_GAME_FETCHED_ALL : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        lastPage: result.lastPage,
      },
    };
  }

  @Auth(Role.Moderator)
  @Post('games')
  async enableForGame(@Body() dto: CreateGuessSkyObjectGameDTO): Promise<ApiResponse<GuessSkyObjectGame>> {
    const data = await this.guessSkyObjectGameRepository.create(dto.spaceSkyObjectId);
    return { code: HttpStatus.CREATED, message: SuccessMessage.GUESS_SKY_OBJECT_GAME_CREATED, data };
  }

  @Auth(Role.Moderator)
  @Patch('games/:id')
  async toggleGame(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGuessSkyObjectGameDTO,
  ): Promise<ApiResponse<null>> {
    await this.guessSkyObjectGameRepository.toggleEnabled(id, dto.isEnabled);
    return { code: HttpStatus.OK, message: SuccessMessage.GUESS_SKY_OBJECT_GAME_UPDATED, data: null };
  }

  @Auth(Role.Moderator)
  @Get('daily-schedule')
  async getDailyScheduleHistory(
    @Query() queryDto: DailyGameScheduleQueryDto,
  ): Promise<PaginatedApiResponse<DailyGameSchedule>> {
    const result = await this.dailyGameScheduleRepository.findPaginated(queryDto);
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.DAILY_SCHEDULE_FETCHED,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        lastPage: result.lastPage,
      },
    };
  }
}