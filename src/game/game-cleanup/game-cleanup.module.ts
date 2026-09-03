import { Module } from '@nestjs/common';
import { GameCleanupService } from './game-cleanup.service';
import { GuessSkyObjectModule } from '../../guessSkyObject/guess-sky-object.module';

@Module({
  imports: [GuessSkyObjectModule],
  providers: [GameCleanupService],
})
export class GameCleanupModule {}
