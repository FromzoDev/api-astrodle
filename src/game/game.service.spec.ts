import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { GameSessionRepository } from './gameSession/game-session.repository';
import { GameStatsRepository } from './gameStats/game-stats.repository';
import { GameConfigRepository } from './gameConfig/game-config.repository';
import { GameType } from '../common/enum/game-type.enum';
import { GameMode } from '../common/enum/game-mode.enum';
import { GameStatus } from '../common/enum/game-status.enum';
import { GameSession } from './gameSession/game-session.entity';
import { PlayableGame } from './interfaces/playable-game.interface';
import { GameConfig } from './gameConfig/game-config.entity';

describe('GameService', () => {
  let service: GameService;
  let gameSessionRepository: jest.Mocked<
    Pick<GameSessionRepository, 'create' | 'findOneById' | 'update'>
  >;
  let gameStatsRepository: jest.Mocked<
    Pick<GameStatsRepository, 'incrementCounters'>
  >;
  let gameConfigRepository: jest.Mocked<
    Pick<GameConfigRepository, 'findEnabledByMode' | 'findOneByGameTypeAndMode'>
  >;
  let gameLogic: jest.Mocked<PlayableGame>;

  const buildSession = (overrides: Partial<GameSession> = {}): GameSession =>
    ({
      id: 'session-1',
      gameType: GameType.GuessSkyObject,
      contentId: 1,
      mode: GameMode.Daily,
      status: GameStatus.InProgress,
      gameData: {},
      startedAt: new Date(),
      finishedAt: undefined,
      ...overrides,
    }) as GameSession;

  const buildConfig = (overrides: Partial<GameConfig> = {}): GameConfig =>
    ({
      id: 1,
      gameType: GameType.GuessSkyObject,
      mode: GameMode.Daily,
      isEnabled: true,
      ...overrides,
    }) as GameConfig;

  beforeEach(async () => {
    gameSessionRepository = {
      create: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
    };
    gameStatsRepository = {
      incrementCounters: jest.fn(),
    };
    gameConfigRepository = {
      findEnabledByMode: jest.fn(),
      findOneByGameTypeAndMode: jest.fn(),
    };
    gameLogic = {
      selectContent: jest.fn(),
      processAction: jest.fn(),
      onGameFinished: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: GameSessionRepository, useValue: gameSessionRepository },
        { provide: GameStatsRepository, useValue: gameStatsRepository },
        { provide: GameConfigRepository, useValue: gameConfigRepository },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  describe('getAvailableGames', () => {
    it('returns the game types of enabled configs for the given mode', async () => {
      gameConfigRepository.findEnabledByMode.mockResolvedValue([
        buildConfig({ gameType: GameType.GuessSkyObject }),
      ]);

      const result = await service.getAvailableGames(GameMode.Daily);

      expect(result).toEqual([GameType.GuessSkyObject]);
      expect(gameConfigRepository.findEnabledByMode).toHaveBeenCalledWith(
        GameMode.Daily,
      );
    });

    it('returns an empty array when no config is enabled for the mode', async () => {
      gameConfigRepository.findEnabledByMode.mockResolvedValue([]);

      const result = await service.getAvailableGames(GameMode.Casual);

      expect(result).toEqual([]);
    });
  });

  describe('isGameAvailableInMode', () => {
    it('returns true when the config exists and is enabled', async () => {
      gameConfigRepository.findOneByGameTypeAndMode.mockResolvedValue(
        buildConfig({ isEnabled: true }),
      );

      const result = await service.isGameAvailableInMode(
        GameType.GuessSkyObject,
        GameMode.Daily,
      );

      expect(result).toBe(true);
    });

    it('returns false when the config exists but is disabled', async () => {
      gameConfigRepository.findOneByGameTypeAndMode.mockResolvedValue(
        buildConfig({ isEnabled: false }),
      );

      const result = await service.isGameAvailableInMode(
        GameType.GuessSkyObject,
        GameMode.Daily,
      );

      expect(result).toBe(false);
    });

    it('returns false when no config is found', async () => {
      gameConfigRepository.findOneByGameTypeAndMode.mockResolvedValue(null);

      const result = await service.isGameAvailableInMode(
        GameType.GuessSkyObject,
        GameMode.Daily,
      );

      expect(result).toBe(false);
    });
  });

  describe('play', () => {
    it('creates a new in-progress session when the game is enabled', async () => {
      gameConfigRepository.findOneByGameTypeAndMode.mockResolvedValue(
        buildConfig({ isEnabled: true }),
      );
      gameLogic.selectContent.mockResolvedValue({
        contentId: 42,
        initialGameData: { attemptsUsed: 0 },
      });
      const createdSession = buildSession({ contentId: 42 });
      gameSessionRepository.create.mockResolvedValue(createdSession);

      const result = await service.play(
        GameType.GuessSkyObject,
        GameMode.Daily,
        gameLogic,
      );

      expect(result).toBe(createdSession);
      expect(gameLogic.selectContent).toHaveBeenCalledWith(GameMode.Daily);
      expect(gameSessionRepository.create).toHaveBeenCalledWith({
        gameType: GameType.GuessSkyObject,
        contentId: 42,
        mode: GameMode.Daily,
        status: GameStatus.InProgress,
        gameData: { attemptsUsed: 0 },
      });
    });

    it('defaults gameData to an empty object when initialGameData is undefined', async () => {
      gameConfigRepository.findOneByGameTypeAndMode.mockResolvedValue(
        buildConfig({ isEnabled: true }),
      );
      gameLogic.selectContent.mockResolvedValue({ contentId: 7 });
      gameSessionRepository.create.mockResolvedValue(buildSession());

      await service.play(GameType.GuessSkyObject, GameMode.Daily, gameLogic);

      expect(gameSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ gameData: {} }),
      );
    });

    it('throws ForbiddenException when the game is not enabled for the mode', async () => {
      gameConfigRepository.findOneByGameTypeAndMode.mockResolvedValue(null);

      await expect(
        service.play(GameType.GuessSkyObject, GameMode.Daily, gameLogic),
      ).rejects.toThrow(ForbiddenException);
      expect(gameLogic.selectContent).not.toHaveBeenCalled();
      expect(gameSessionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('submitAction', () => {
    it('throws NotFoundException when the session does not exist', async () => {
      gameSessionRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.submitAction('missing-session', { guess: 'x' }, gameLogic),
      ).rejects.toThrow(NotFoundException);
      expect(gameLogic.processAction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the session is already finished', async () => {
      gameSessionRepository.findOneById.mockResolvedValue(
        buildSession({ status: GameStatus.Won }),
      );

      await expect(
        service.submitAction('session-1', { guess: 'x' }, gameLogic),
      ).rejects.toThrow(BadRequestException);
      expect(gameLogic.processAction).not.toHaveBeenCalled();
    });

    it('updates the session without finishedAt and does not record stats while still in progress', async () => {
      const session = buildSession();
      gameSessionRepository.findOneById.mockResolvedValue(session);
      gameLogic.processAction.mockResolvedValue({
        status: GameStatus.InProgress,
        gameData: { attemptsUsed: 1 },
      });
      const updatedSession = buildSession({ gameData: { attemptsUsed: 1 } });
      gameSessionRepository.update.mockResolvedValue(updatedSession);

      const result = await service.submitAction(
        'session-1',
        { guess: 'wrong' },
        gameLogic,
      );

      expect(result).toBe(updatedSession);
      expect(gameSessionRepository.update).toHaveBeenCalledWith('session-1', {
        gameData: { attemptsUsed: 1 },
        status: GameStatus.InProgress,
      });
      expect(gameStatsRepository.incrementCounters).not.toHaveBeenCalled();
      expect(gameLogic.onGameFinished).not.toHaveBeenCalled();
    });

    it('sets finishedAt, increments stats as a win, and calls onGameFinished when the game is won', async () => {
      const session = buildSession();
      gameSessionRepository.findOneById.mockResolvedValue(session);
      gameLogic.processAction.mockResolvedValue({
        status: GameStatus.Won,
        gameData: { attemptsUsed: 3 },
      });
      const updatedSession = buildSession({
        status: GameStatus.Won,
        gameData: { attemptsUsed: 3 },
        finishedAt: new Date(),
      });
      gameSessionRepository.update.mockResolvedValue(updatedSession);

      const result = await service.submitAction(
        'session-1',
        { guess: 'correct' },
        gameLogic,
      );

      expect(result).toBe(updatedSession);
      expect(gameSessionRepository.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          status: GameStatus.Won,
          finishedAt: expect.any(Date),
        }),
      );
      expect(gameStatsRepository.incrementCounters).toHaveBeenCalledWith(
        session.gameType,
        session.mode,
        true,
      );
      expect(gameLogic.onGameFinished).toHaveBeenCalledWith(
        updatedSession,
        GameStatus.Won,
      );
    });

    it('sets finishedAt, increments stats as a loss, and calls onGameFinished when the game is lost', async () => {
      const session = buildSession();
      gameSessionRepository.findOneById.mockResolvedValue(session);
      gameLogic.processAction.mockResolvedValue({
        status: GameStatus.Lost,
        gameData: { attemptsUsed: 10 },
      });
      const updatedSession = buildSession({
        status: GameStatus.Lost,
        gameData: { attemptsUsed: 10 },
        finishedAt: new Date(),
      });
      gameSessionRepository.update.mockResolvedValue(updatedSession);

      await service.submitAction('session-1', { guess: 'wrong' }, gameLogic);

      expect(gameStatsRepository.incrementCounters).toHaveBeenCalledWith(
        session.gameType,
        session.mode,
        false,
      );
      expect(gameLogic.onGameFinished).toHaveBeenCalledWith(
        updatedSession,
        GameStatus.Lost,
      );
    });

    it('falls back to the original gameData when the result does not provide gameData', async () => {
      const session = buildSession({ gameData: { attemptsUsed: 5 } });
      gameSessionRepository.findOneById.mockResolvedValue(session);
      gameLogic.processAction.mockResolvedValue({
        status: GameStatus.InProgress,
      });
      gameSessionRepository.update.mockResolvedValue(session);

      await service.submitAction('session-1', { guess: 'x' }, gameLogic);

      expect(gameSessionRepository.update).toHaveBeenCalledWith('session-1', {
        gameData: { attemptsUsed: 5 },
        status: GameStatus.InProgress,
      });
    });
  });
});
