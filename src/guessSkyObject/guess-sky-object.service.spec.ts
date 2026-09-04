import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GuessSkyObjectService } from './guess-sky-object.service';
import { SpaceSkyObjectRepository } from '../spaceSkyObject/space-sky-object.repository';
import { GuessSkyObjectGameRepository } from './guess-sky-object-game.repository';
import { GuessSkyObjectStatsRepository } from './guess-sky-object-stats.repository';
import { GameStatsRepository } from '../game/gameStats/game-stats.repository';
import { GameMode } from '../common/enum/game-mode.enum';
import { GameStatus } from '../common/enum/game-status.enum';
import { GameType } from '../common/enum/game-type.enum';
import { GameSession } from '../game/gameSession/game-session.entity';
import { SpaceSkyObject } from '../spaceSkyObject/space-sky-object.entity';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';
import { GuessSkyObjectSessionData } from './guess-sky-object-session-data.interface';

describe('GuessSkyObjectService', () => {
  let service: GuessSkyObjectService;
  let spaceSkyObjectRepository: jest.Mocked<
    Pick<SpaceSkyObjectRepository, 'findOneById'>
  >;
  let guessSkyObjectGameRepository: jest.Mocked<
    Pick<
      GuessSkyObjectGameRepository,
      | 'findTodaysGame'
      | 'findRandomEnabled'
      | 'findBySpaceSkyObjectId'
      | 'incrementStats'
    >
  >;
  let guessSkyObjectStatsRepository: jest.Mocked<
    Pick<GuessSkyObjectStatsRepository, 'incrementOnFinish' | 'findByMode'>
  >;
  let gameStatsRepository: jest.Mocked<
    Pick<GameStatsRepository, 'findByGameTypeAndMode'>
  >;

  const buildSpaceSkyObject = (
    overrides: Partial<SpaceSkyObject> = {},
  ): SpaceSkyObject =>
    ({
      id: 1,
      name: 'Orion Nebula',
      constellationName: 'Orion',
      discoveryDate: new Date('1610-01-01'),
      objectType: 'nebula',
      magnitude: 4,
      distanceLightYears: 1344,
      objectImage: 'orion.png',
      description: 'A diffuse nebula.',
      discoverer: undefined,
      telescope: undefined,
      ...overrides,
    }) as SpaceSkyObject;

  const buildGame = (
    overrides: Partial<GuessSkyObjectGame> = {},
  ): GuessSkyObjectGame =>
    ({
      id: 5,
      spaceSkyObject: buildSpaceSkyObject(),
      isEnabled: true,
      totalPlayed: 0,
      totalWon: 0,
      totalLost: 0,
      totalAbandoned: 0,
      winRate: 0,
      avgAttemptsUsed: 0,
      winCountByAttemptNumber: {},
      ...overrides,
    }) as GuessSkyObjectGame;

  const buildSession = (
    gameData: GuessSkyObjectSessionData,
    overrides: Partial<GameSession> = {},
  ): GameSession =>
    ({
      id: 'session-1',
      gameType: GameType.GuessSkyObject,
      contentId: 1,
      mode: GameMode.Daily,
      status: GameStatus.InProgress,
      gameData,
      startedAt: new Date(),
      finishedAt: undefined,
      ...overrides,
    }) as GameSession;

  const defaultData = (): GuessSkyObjectSessionData => ({
    attemptsUsed: 0,
    maxAttempts: 10,
    nameLength: 'Orion Nebula'.length,
    revealedTileIndexes: [],
    revealedLetterIndexes: [],
    revealedHintKeys: [],
  });

  beforeEach(async () => {
    spaceSkyObjectRepository = {
      findOneById: jest.fn(),
    };
    guessSkyObjectGameRepository = {
      findTodaysGame: jest.fn(),
      findRandomEnabled: jest.fn(),
      findBySpaceSkyObjectId: jest.fn(),
      incrementStats: jest.fn(),
    };
    guessSkyObjectStatsRepository = {
      incrementOnFinish: jest.fn(),
      findByMode: jest.fn(),
    };
    gameStatsRepository = {
      findByGameTypeAndMode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuessSkyObjectService,
        {
          provide: SpaceSkyObjectRepository,
          useValue: spaceSkyObjectRepository,
        },
        {
          provide: GuessSkyObjectGameRepository,
          useValue: guessSkyObjectGameRepository,
        },
        {
          provide: GuessSkyObjectStatsRepository,
          useValue: guessSkyObjectStatsRepository,
        },
        { provide: GameStatsRepository, useValue: gameStatsRepository },
      ],
    }).compile();

    service = module.get<GuessSkyObjectService>(GuessSkyObjectService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('selectContent', () => {
    it('uses findTodaysGame for daily mode and builds fresh session data', async () => {
      const game = buildGame();
      guessSkyObjectGameRepository.findTodaysGame.mockResolvedValue(game);

      const result = await service.selectContent(GameMode.Daily);

      expect(guessSkyObjectGameRepository.findTodaysGame).toHaveBeenCalled();
      expect(
        guessSkyObjectGameRepository.findRandomEnabled,
      ).not.toHaveBeenCalled();
      expect(result.contentId).toBe(game.spaceSkyObject.id);
      expect(result.initialGameData).toEqual({
        attemptsUsed: 0,
        maxAttempts: 10,
        nameLength: game.spaceSkyObject.name.length,
        revealedTileIndexes: [],
        revealedLetterIndexes: [],
        revealedHintKeys: [],
      });
    });

    it('uses findRandomEnabled for casual mode', async () => {
      const game = buildGame({ id: 6 });
      guessSkyObjectGameRepository.findRandomEnabled.mockResolvedValue(game);

      const result = await service.selectContent(GameMode.Casual);

      expect(
        guessSkyObjectGameRepository.findRandomEnabled,
      ).toHaveBeenCalled();
      expect(guessSkyObjectGameRepository.findTodaysGame).not.toHaveBeenCalled();
      expect(result.contentId).toBe(game.spaceSkyObject.id);
    });

    it('throws BadRequestException when no game is available', async () => {
      guessSkyObjectGameRepository.findTodaysGame.mockResolvedValue(null);

      await expect(service.selectContent(GameMode.Daily)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('processAction', () => {
    it('throws BadRequestException when the space sky object is not found', async () => {
      spaceSkyObjectRepository.findOneById.mockResolvedValue(null);
      const session = buildSession(defaultData());

      await expect(
        service.processAction(session, { guess: 'anything' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns Won status when the guess matches the name exactly', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Orion Nebula' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data = defaultData();
      const session = buildSession(data);

      const result = await service.processAction(session, {
        guess: 'Orion Nebula',
      });

      expect(result).toEqual({ status: GameStatus.Won, gameData: data });
    });

    it('returns Won status when the guess differs only by case and accents', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Étoile Polaire' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data = defaultData();
      const session = buildSession(data);

      const result = await service.processAction(session, {
        guess: '  etoile polaire  ',
      });

      expect(result.status).toBe(GameStatus.Won);
    });

    it('reveals a new tile, letter and hint on a wrong guess before the last attempt', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Orion Nebula' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data = defaultData();
      const session = buildSession(data);
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const result = await service.processAction(session, {
        guess: 'Wrong Guess',
      });

      expect(result.status).toBe(GameStatus.InProgress);
      const updated = result.gameData as GuessSkyObjectSessionData;
      expect(updated.attemptsUsed).toBe(1);
      expect(updated.revealedTileIndexes).toEqual([0]);
      expect(updated.revealedLetterIndexes).toEqual([0]);
      expect(updated.revealedHintKeys).toEqual(['constellationName']);
    });

    it('returns Lost status when the wrong guess exhausts the last attempt', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Orion Nebula' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data: GuessSkyObjectSessionData = {
        ...defaultData(),
        attemptsUsed: 9,
        maxAttempts: 10,
      };
      const session = buildSession(data);

      const result = await service.processAction(session, {
        guess: 'Still Wrong',
      });

      expect(result).toEqual({
        status: GameStatus.Lost,
        gameData: { ...data, attemptsUsed: 10 },
      });
    });

    it('does not add a new tile when all tiles have already been revealed', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Orion Nebula' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data: GuessSkyObjectSessionData = {
        ...defaultData(),
        revealedTileIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      };
      const session = buildSession(data);
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const result = await service.processAction(session, {
        guess: 'Wrong Guess',
      });

      const updated = result.gameData as GuessSkyObjectSessionData;
      expect(updated.revealedTileIndexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('does not add a new hint when all hints have already been revealed', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Orion Nebula' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const allHintKeys = [
        'constellationName',
        'discoveryDate',
        'objectType',
        'magnitude',
        'distanceLightYears',
        'description',
        'discoverer.firstName',
        'discoverer.lastName',
        'discoverer.nationality',
        'discoverer.profession',
        'discoverer.personalityImage',
        'discoverer.dateOfBirth',
        'discoverer.dateOfDeath',
        'discoverer.description',
        'telescope.name',
        'telescope.telescopeLocation',
        'telescope.telescopeSpectrum',
        'telescope.telescopeImage',
      ];
      const data: GuessSkyObjectSessionData = {
        ...defaultData(),
        revealedHintKeys: allHintKeys,
      };
      const session = buildSession(data);
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const result = await service.processAction(session, {
        guess: 'Wrong Guess',
      });

      const updated = result.gameData as GuessSkyObjectSessionData;
      expect(updated.revealedHintKeys).toEqual(allHintKeys);
    });
  });

  describe('onGameFinished', () => {
    it('increments the game and global stats as a win', async () => {
      const data: GuessSkyObjectSessionData = {
        ...defaultData(),
        attemptsUsed: 4,
      };
      const session = buildSession(data, { contentId: 1, mode: GameMode.Daily });
      const game = buildGame({ id: 5 });
      guessSkyObjectGameRepository.findBySpaceSkyObjectId.mockResolvedValue(
        game,
      );

      await service.onGameFinished(session, GameStatus.Won);

      expect(
        guessSkyObjectGameRepository.findBySpaceSkyObjectId,
      ).toHaveBeenCalledWith(1);
      expect(guessSkyObjectGameRepository.incrementStats).toHaveBeenCalledWith(
        5,
        4,
        true,
      );
      expect(
        guessSkyObjectStatsRepository.incrementOnFinish,
      ).toHaveBeenCalledWith(GameMode.Daily, 4, true);
    });

    it('increments the game and global stats as a loss', async () => {
      const data: GuessSkyObjectSessionData = {
        ...defaultData(),
        attemptsUsed: 10,
      };
      const session = buildSession(data, { contentId: 2, mode: GameMode.Casual });
      const game = buildGame({ id: 6 });
      guessSkyObjectGameRepository.findBySpaceSkyObjectId.mockResolvedValue(
        game,
      );

      await service.onGameFinished(session, GameStatus.Lost);

      expect(guessSkyObjectGameRepository.incrementStats).toHaveBeenCalledWith(
        6,
        10,
        false,
      );
      expect(
        guessSkyObjectStatsRepository.incrementOnFinish,
      ).toHaveBeenCalledWith(GameMode.Casual, 10, false);
    });
  });

  describe('buildClientView', () => {
    it('masks unrevealed letters (except spaces) while the game is in progress', async () => {
      const spaceSkyObject = buildSpaceSkyObject({ name: 'Orion Nebula' });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data: GuessSkyObjectSessionData = {
        ...defaultData(),
        revealedLetterIndexes: [0, 6],
        revealedTileIndexes: [2],
        revealedHintKeys: ['constellationName'],
        attemptsUsed: 1,
      };
      const session = buildSession(data, { status: GameStatus.InProgress });

      const view = await service.buildClientView(session);

      expect(view.partialName).toBe('O____ N_____');
      expect(view.status).toBe(GameStatus.InProgress);
      expect(view.attemptsUsed).toBe(1);
      expect(view.maxAttempts).toBe(10);
      expect(view.revealedTiles).toEqual([2]);
      expect(view.revealedHints).toEqual([
        { key: 'constellationName', value: 'Orion' },
      ]);
      expect(view).not.toHaveProperty('fullName');
      expect(view).not.toHaveProperty('objectImage');
    });

    it('reveals the full name and image when the game is finished', async () => {
      const spaceSkyObject = buildSpaceSkyObject({
        name: 'Orion Nebula',
        objectImage: 'orion.png',
      });
      spaceSkyObjectRepository.findOneById.mockResolvedValue(spaceSkyObject);
      const data = defaultData();
      const session = buildSession(data, { status: GameStatus.Won });

      const view = await service.buildClientView(session);

      expect(view.partialName).toBe('Orion Nebula');
      expect(view.fullName).toBe('Orion Nebula');
      expect(view.objectImage).toBe('orion.png');
    });
  });

  describe('getGlobalStats', () => {
    it('combines universal and specific stats when both exist', async () => {
      gameStatsRepository.findByGameTypeAndMode.mockResolvedValue({
        totalPlayed: 10,
        totalWon: 6,
        totalLost: 4,
        winRate: 60,
      } as any);
      guessSkyObjectStatsRepository.findByMode.mockResolvedValue({
        avgAttemptsUsed: 3.5,
        winCountByAttemptNumber: { 2: 3, 3: 3 },
      } as any);

      const result = await service.getGlobalStats(GameMode.Daily);

      expect(gameStatsRepository.findByGameTypeAndMode).toHaveBeenCalledWith(
        GameType.GuessSkyObject,
        GameMode.Daily,
      );
      expect(guessSkyObjectStatsRepository.findByMode).toHaveBeenCalledWith(
        GameMode.Daily,
      );
      expect(result).toEqual({
        totalPlayed: 10,
        totalWon: 6,
        totalLost: 4,
        winRate: 60,
        avgAttemptsUsed: 3.5,
        winCountByAttemptNumber: { 2: 3, 3: 3 },
      });
    });

    it('returns default zero-value stats when no records exist yet', async () => {
      gameStatsRepository.findByGameTypeAndMode.mockResolvedValue(null);
      guessSkyObjectStatsRepository.findByMode.mockResolvedValue(null);

      const result = await service.getGlobalStats(GameMode.Casual);

      expect(result).toEqual({
        totalPlayed: 0,
        totalWon: 0,
        totalLost: 0,
        winRate: 0,
        avgAttemptsUsed: 0,
        winCountByAttemptNumber: {},
      });
    });
  });
});
