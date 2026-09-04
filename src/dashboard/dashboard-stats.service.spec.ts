import { Test, TestingModule } from '@nestjs/testing';
import { DashboardStatsService } from './dashboard-stats.service';
import { GuessSkyObjectService } from '../guessSkyObject/guess-sky-object.service';
import { GameType } from '../common/enum/game-type.enum';
import { GameMode } from '../common/enum/game-mode.enum';

describe('DashboardStatsService', () => {
  let service: DashboardStatsService;
  let guessSkyObjectService: jest.Mocked<GuessSkyObjectService>;

  beforeEach(async () => {
    const guessSkyObjectServiceMock = {
      getGlobalStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardStatsService,
        {
          provide: GuessSkyObjectService,
          useValue: guessSkyObjectServiceMock,
        },
      ],
    }).compile();

    service = module.get<DashboardStatsService>(DashboardStatsService);
    guessSkyObjectService = module.get(GuessSkyObjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGamesOverview', () => {
    it('builds an overview entry from the guess-sky-object global stats', async () => {
      const stats = {
        totalPlayed: 10,
        totalWon: 6,
        totalLost: 4,
        winRate: 0.6,
        avgAttemptsUsed: 3.2,
        winCountByAttemptNumber: { 1: 2, 2: 4 },
      };
      guessSkyObjectService.getGlobalStats.mockResolvedValue(stats);

      const result = await service.getAllGamesOverview(GameMode.Daily);

      expect(result).toEqual([
        { gameType: GameType.GuessSkyObject, stats },
      ]);
      expect(guessSkyObjectService.getGlobalStats).toHaveBeenCalledWith(
        GameMode.Daily,
      );
      expect(guessSkyObjectService.getGlobalStats).toHaveBeenCalledTimes(1);
    });

    it('forwards the requested game mode to the underlying service', async () => {
      guessSkyObjectService.getGlobalStats.mockResolvedValue({
        totalPlayed: 0,
        totalWon: 0,
        totalLost: 0,
        winRate: 0,
        avgAttemptsUsed: 0,
        winCountByAttemptNumber: {},
      });

      await service.getAllGamesOverview(GameMode.Casual);

      expect(guessSkyObjectService.getGlobalStats).toHaveBeenCalledWith(
        GameMode.Casual,
      );
    });

    it('propagates errors thrown by the underlying service', async () => {
      guessSkyObjectService.getGlobalStats.mockRejectedValue(
        new Error('stats unavailable'),
      );

      await expect(
        service.getAllGamesOverview(GameMode.Daily),
      ).rejects.toThrow('stats unavailable');
    });
  });
});
