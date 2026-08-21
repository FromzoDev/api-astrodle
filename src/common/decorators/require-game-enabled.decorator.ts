import { SetMetadata } from '@nestjs/common';
import { GameMode } from '../enum/game-mode.enum';
import { GameType } from '../enum/game-type.enum';

export const GAME_ENABLED_KEY = 'gameEnabled';

export interface GameEnabledMetadata {
  gameType: GameType;
  mode: GameMode;
}

export const RequireGameEnabled = (gameType: GameType, mode: GameMode) =>
  SetMetadata(GAME_ENABLED_KEY, { gameType, mode });
