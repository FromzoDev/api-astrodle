import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { GameConfigRepository } from './game-config.repository';
import { createGameConfigDTO } from './DTO/create-game-config-dto';
import { updateGameConfigDTO } from './DTO/update-game-config-dto';
import { GameConfig } from './game-config.entity';
import { ApiResponse } from '../../common/interfaces/response.interface';
import { SuccessMessage } from '../../common/enum/success.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enum/roles.enum';

@ApiBearerAuth('JWT-auth')
@Controller('games/config')
export class GameConfigController {
  constructor(private readonly gameConfigRepository: GameConfigRepository) {}

  @Auth(Role.Admin)
  @Get()
  async getAllConfigs(): Promise<ApiResponse<GameConfig[]>> {
    const data = await this.gameConfigRepository.findAll();
    return { code: HttpStatus.OK, message: SuccessMessage.GAME_CONFIG_FETCHED, data };
  }

  @Auth(Role.Admin)
  @Post()
  async createConfig(@Body() dto: createGameConfigDTO): Promise<ApiResponse<GameConfig>> {
    const data = await this.gameConfigRepository.createGameConfig(dto);
    return { code: HttpStatus.CREATED, message: SuccessMessage.GAME_CONFIG_CREATED, data };
  }

  @Auth(Role.Admin)
  @Patch(':id')
  async updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: updateGameConfigDTO,
  ): Promise<ApiResponse<GameConfig | null>> {
    const data = await this.gameConfigRepository.updateGameConfig(id, dto);
    return { code: HttpStatus.OK, message: SuccessMessage.GAME_CONFIG_UPDATED, data };
  }

  @Auth(Role.Admin)
  @Delete(':id')
  async deleteConfig(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.gameConfigRepository.deleteGameConfig(id);
    return { code: HttpStatus.OK, message: SuccessMessage.GAME_CONFIG_DELETED, data: null };
  }
}