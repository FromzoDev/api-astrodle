import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { GameService } from './game.service';
import { GameMode } from '../common/enum/game-mode.enum';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiResponse } from '../common/interfaces/response.interface';
import { GameType } from '../common/enum/game-type.enum';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('modes/:mode/available-games')
  async getAvailableGames(
    @Param('mode') mode: GameMode,
  ): Promise<ApiResponse<GameType[]>> {
    const data = await this.gameService.getAvailableGames(mode);
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.AVAILABLE_GAMES_FETCHED,
      data,
    };
  }
}
