import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GameService } from '../../game/game.service';
import {
  GAME_ENABLED_KEY,
  GameEnabledMetadata,
} from '../decorators/require-game-enabled.decorator';
import { ErrorMessage } from '../enum/error.enum';

@Injectable()
export class GameEnabledGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly gameService: GameService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<GameEnabledMetadata>(
      GAME_ENABLED_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const { gameType, mode } = metadata;
    const isEnabled = await this.gameService.isGameAvailableInMode(
      gameType,
      mode,
    );

    if (!isEnabled) {
      throw new ForbiddenException(ErrorMessage.GAME_NOT_AVAILABLE);
    }

    return true;
  }
}
