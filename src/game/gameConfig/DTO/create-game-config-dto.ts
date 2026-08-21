import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { GameMode } from '../../../common/enum/game-mode.enum';
import { GameType } from '../../../common/enum/game-type.enum';

export class createGameConfigDTO {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType: GameType;

  @ApiProperty({ enum: GameMode })
  @IsEnum(GameMode)
  mode: GameMode;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}