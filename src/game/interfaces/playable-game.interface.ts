import { GameMode } from '../../common/enum/game-mode.enum';
import { GameStatus } from '../../common/enum/game-status.enum';
import { GameSession } from '../gameSession/game-session.entity';

export interface SelectedContent {
  contentId: number;
  initialGameData?: Record<string, any>;
}

export interface GuessResult {
  status: GameStatus;
  gameData?: Record<string, any>;
}

export interface PlayableGame {
  selectContent(mode: GameMode): Promise<SelectedContent>;
  processAction(session: GameSession, action: unknown): Promise<GuessResult>;
  onGameFinished(session: GameSession, status: GameStatus): Promise<void>;
}
