import { Test, TestingModule } from '@nestjs/testing';
import { GameCleanupService } from './game-cleanup.service';
import { GameSessionRepository } from '../gameSession/game-session.repository';
import { GameStatsRepository } from '../gameStats/game-stats.repository';
import { GuessSkyObjectGameRepository } from '../../guessSkyObject/guess-sky-object-game.repository';
import { GameType } from '../../common/enum/game-type.enum';
import { GameMode } from '../../common/enum/game-mode.enum';
import { GameStatus } from '../../common/enum/game-status.enum';
import { GameSession } from '../gameSession/game-session.entity';
import { GuessSkyObjectGame } from '../../guessSkyObject/guess-sky-object-game.entity';

describe('GameCleanupService', () => {
  let service: GameCleanupService;
  let gameSessionRepository: jest.Mocked<
    Pick<
      GameSessionRepository,
      'findAbandonableSessions' | 'abandonSessions'
    >
  >;
  let gameStatsRepository: jest.Mocked<
    Pick<GameStatsRepository, 'incrementAbandoned'>
  >;
  let guessSkyObjectGameRepository: jest.Mocked<
    Pick<
      GuessSkyObjectGameRepository,
      'findBySpaceSkyObjectId' | 'incrementAbandoned'
    >
  >;

  const buildSession = (overrides: Partial<GameSession> = {}): GameSession =>
    ({
      id: 'session-1',
      gameType: GameType.GuessSkyObject,
      contentId: 10,
      mode: GameMode.Daily,
      status: GameStatus.InProgress,
      gameData: {},
      startedAt: new Date(),
      finishedAt: undefined,
      ...overrides,
    }) as GameSession;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-05T12:00:00.000Z'));

    gameSessionRepository = {
      findAbandonableSessions: jest.fn(),
      abandonSessions: jest.fn(),
    };
    gameStatsRepository = {
      incrementAbandoned: jest.fn(),
    };
    guessSkyObjectGameRepository = {
      findBySpaceSkyObjectId: jest.fn(),
      incrementAbandoned: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameCleanupService,
        { provide: GameSessionRepository, useValue: gameSessionRepository },
        { provide: GameStatsRepository, useValue: gameStatsRepository },
        {
          provide: GuessSkyObjectGameRepository,
          useValue: guessSkyObjectGameRepository,
        },
      ],
    }).compile();

    service = module.get<GameCleanupService>(GameCleanupService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('cleanupAbandonedSessions', () => {
    it('does nothing when there are no abandonable sessions', async () => {
      gameSessionRepository.findAbandonableSessions.mockResolvedValue([]);

      await service.cleanupAbandonedSessions();

      expect(gameSessionRepository.abandonSessions).not.toHaveBeenCalled();
      expect(gameStatsRepository.incrementAbandoned).not.toHaveBeenCalled();
      expect(
        guessSkyObjectGameRepository.findBySpaceSkyObjectId,
      ).not.toHaveBeenCalled();
    });

    it('queries for sessions older than 24 hours from now', async () => {
      gameSessionRepository.findAbandonableSessions.mockResolvedValue([]);

      await service.cleanupAbandonedSessions();

      const cutoffArg =
        gameSessionRepository.findAbandonableSessions.mock.calls[0][0];
      expect(cutoffArg).toEqual(new Date('2026-09-04T12:00:00.000Z'));
    });

    it('abandons stale sessions, increments universal and content-specific stats', async () => {
      const staleSession = buildSession({
        id: 'stale-1',
        gameType: GameType.GuessSkyObject,
        mode: GameMode.Daily,
        contentId: 10,
      });
      gameSessionRepository.findAbandonableSessions.mockResolvedValue([
        staleSession,
      ]);
      const game = { id: 99 } as GuessSkyObjectGame;
      guessSkyObjectGameRepository.findBySpaceSkyObjectId.mockResolvedValue(
        game,
      );

      await service.cleanupAbandonedSessions();

      expect(gameSessionRepository.abandonSessions).toHaveBeenCalledWith([
        'stale-1',
      ]);
      expect(gameStatsRepository.incrementAbandoned).toHaveBeenCalledWith(
        GameType.GuessSkyObject,
        GameMode.Daily,
      );
      expect(
        guessSkyObjectGameRepository.findBySpaceSkyObjectId,
      ).toHaveBeenCalledWith(10);
      expect(guessSkyObjectGameRepository.incrementAbandoned).toHaveBeenCalledWith(
        99,
      );
    });

    it('handles multiple stale sessions, one per game type/content', async () => {
      const session1 = buildSession({ id: 's1', contentId: 10 });
      const session2 = buildSession({ id: 's2', contentId: 20 });
      gameSessionRepository.findAbandonableSessions.mockResolvedValue([
        session1,
        session2,
      ]);
      guessSkyObjectGameRepository.findBySpaceSkyObjectId
        .mockResolvedValueOnce({ id: 1 } as GuessSkyObjectGame)
        .mockResolvedValueOnce({ id: 2 } as GuessSkyObjectGame);

      await service.cleanupAbandonedSessions();

      expect(gameSessionRepository.abandonSessions).toHaveBeenCalledWith([
        's1',
        's2',
      ]);
      expect(gameStatsRepository.incrementAbandoned).toHaveBeenCalledTimes(2);
      expect(guessSkyObjectGameRepository.incrementAbandoned).toHaveBeenCalledWith(
        1,
      );
      expect(guessSkyObjectGameRepository.incrementAbandoned).toHaveBeenCalledWith(
        2,
      );
    });

    it('does not increment content-specific abandoned stats when no matching game is found', async () => {
      const staleSession = buildSession({ id: 'stale-1', contentId: 999 });
      gameSessionRepository.findAbandonableSessions.mockResolvedValue([
        staleSession,
      ]);
      guessSkyObjectGameRepository.findBySpaceSkyObjectId.mockResolvedValue(
        null,
      );

      await service.cleanupAbandonedSessions();

      expect(gameStatsRepository.incrementAbandoned).toHaveBeenCalledWith(
        GameType.GuessSkyObject,
        GameMode.Daily,
      );
      expect(
        guessSkyObjectGameRepository.incrementAbandoned,
      ).not.toHaveBeenCalled();
    });
  });
});
