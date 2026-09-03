import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameConfig } from './gameConfig/game-config.entity';
import { GameSession } from './gameSession/game-session.entity';
import { GameStats } from './gameStats/game-stats.entity';
import { GameConfigRepository } from './gameConfig/game-config.repository';
import { GameSessionRepository } from './gameSession/game-session.repository';
import { GameStatsRepository } from './gameStats/game-stats.repository';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameConfigController } from './gameConfig/game-config.controller';
import { GameEnabledGuard } from '../common/guards/game-enabled.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GameConfig, GameSession, GameStats])],
  controllers: [GameController, GameConfigController],
  providers: [
    GameService,
    GameConfigRepository,
    GameSessionRepository,
    GameStatsRepository,
    GameEnabledGuard,
  ],
  exports: [
    GameService,
    GameConfigRepository,
    GameSessionRepository,
    GameStatsRepository,
    GameEnabledGuard,
  ],
})
export class GameModule {}
