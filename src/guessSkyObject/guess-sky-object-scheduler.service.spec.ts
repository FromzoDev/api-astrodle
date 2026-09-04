import { Test, TestingModule } from '@nestjs/testing';
import { GuessSkyObjectSchedulerService } from './guess-sky-object-scheduler.service';
import { GuessSkyObjectGameRepository } from './guess-sky-object-game.repository';
import { DailyGameScheduleRepository } from './daily-game-schedule.repository';
import { DailyGameSchedule } from './daily-game-schedule.entity';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';
import { SpaceSkyObject } from '../spaceSkyObject/space-sky-object.entity';

describe('GuessSkyObjectSchedulerService', () => {
  let service: GuessSkyObjectSchedulerService;
  let guessSkyObjectGameRepository: jest.Mocked<
    Pick<GuessSkyObjectGameRepository, 'planTodaysGame'>
  >;
  let dailyGameScheduleRepository: jest.Mocked<
    Pick<DailyGameScheduleRepository, 'findByDate'>
  >;

  const buildGame = (
    overrides: Partial<GuessSkyObjectGame> = {},
  ): GuessSkyObjectGame =>
    ({
      id: 1,
      spaceSkyObject: { id: 42, name: 'Orion Nebula' } as SpaceSkyObject,
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

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-05T10:00:00.000Z'));

    guessSkyObjectGameRepository = {
      planTodaysGame: jest.fn(),
    };
    dailyGameScheduleRepository = {
      findByDate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuessSkyObjectSchedulerService,
        {
          provide: GuessSkyObjectGameRepository,
          useValue: guessSkyObjectGameRepository,
        },
        {
          provide: DailyGameScheduleRepository,
          useValue: dailyGameScheduleRepository,
        },
      ],
    }).compile();

    service = module.get<GuessSkyObjectSchedulerService>(
      GuessSkyObjectSchedulerService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('planTodaysGame', () => {
    it("does nothing when today's schedule already exists", async () => {
      dailyGameScheduleRepository.findByDate.mockResolvedValue({
        date: '2026-09-05',
      } as DailyGameSchedule);

      await service.planTodaysGame();

      expect(dailyGameScheduleRepository.findByDate).toHaveBeenCalledWith(
        '2026-09-05',
      );
      expect(guessSkyObjectGameRepository.planTodaysGame).not.toHaveBeenCalled();
    });

    it("plans today's game when no schedule exists yet", async () => {
      dailyGameScheduleRepository.findByDate.mockResolvedValue(null);
      const game = buildGame();
      guessSkyObjectGameRepository.planTodaysGame.mockResolvedValue(game);

      await service.planTodaysGame();

      expect(guessSkyObjectGameRepository.planTodaysGame).toHaveBeenCalledWith(
        '2026-09-05',
      );
    });

    it('does not throw when no enabled object is available to plan', async () => {
      dailyGameScheduleRepository.findByDate.mockResolvedValue(null);
      guessSkyObjectGameRepository.planTodaysGame.mockResolvedValue(null);

      await expect(service.planTodaysGame()).resolves.toBeUndefined();
      expect(guessSkyObjectGameRepository.planTodaysGame).toHaveBeenCalledWith(
        '2026-09-05',
      );
    });

    it('derives the date key from the current UTC date', async () => {
      jest.setSystemTime(new Date('2026-01-01T23:30:00.000Z'));
      dailyGameScheduleRepository.findByDate.mockResolvedValue(null);
      guessSkyObjectGameRepository.planTodaysGame.mockResolvedValue(
        buildGame(),
      );

      await service.planTodaysGame();

      expect(dailyGameScheduleRepository.findByDate).toHaveBeenCalledWith(
        '2026-01-01',
      );
      expect(guessSkyObjectGameRepository.planTodaysGame).toHaveBeenCalledWith(
        '2026-01-01',
      );
    });
  });
});
