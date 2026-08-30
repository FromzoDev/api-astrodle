import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';
import { GuessSkyObjectGameQueryDto } from './DTO/guess-sky-object-game-query-dto';
import { DailyGameScheduleRepository } from './daily-game-schedule.repository';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { FilterService } from '../shared/filter/filter.service';

@Injectable()
export class GuessSkyObjectGameRepository {
  constructor(
    @InjectRepository(GuessSkyObjectGame)
    private readonly repository: Repository<GuessSkyObjectGame>,
    private readonly dailyGameScheduleRepository: DailyGameScheduleRepository,
    private readonly paginationService: PaginationService,
    private readonly filterService: FilterService,
  ) {}

  async findPaginated(options: GuessSkyObjectGameQueryDto): Promise<PaginationResult<GuessSkyObjectGame>> {
    let queryBuilder = this.repository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.spaceSkyObject', 'spaceSkyObject');

    queryBuilder = this.filterService.applySearch(queryBuilder, options.search, [
      'spaceSkyObject.name',
    ]);

    queryBuilder = this.filterService.applyExactFilter(queryBuilder, options.isEnabled, 'game.isEnabled');

    queryBuilder = this.filterService.applyOrderFilter(
      queryBuilder,
      options.orderBy ? `game.${options.orderBy}` : undefined,
      options.orderDirection,
    );

    return this.paginationService.paginate(queryBuilder, options);
  }

  async findBySpaceSkyObjectId(spaceSkyObjectId: number): Promise<GuessSkyObjectGame | null> {
    return this.repository.findOne({
      where: { spaceSkyObject: { id: spaceSkyObjectId } },
      relations: ['spaceSkyObject'],
    });
  }

  async findAllEnabled(): Promise<GuessSkyObjectGame[]> {
    return this.repository.find({
      where: { isEnabled: true },
      relations: ['spaceSkyObject'],
    });
  }

  async findRandomEnabled(): Promise<GuessSkyObjectGame | null> {
    return this.repository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.spaceSkyObject', 'spaceSkyObject')
      .where('game.isEnabled = :enabled', { enabled: true })
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }

  async findTodaysGame(): Promise<GuessSkyObjectGame | null> {
    const today = new Date().toISOString().split('T')[0];

    const existing = await this.dailyGameScheduleRepository.findByDate(today);
    if (existing) {
      return existing.guessSkyObjectGame;
    }

    return this.planTodaysGame(today);
  }

  async planTodaysGame(date: string): Promise<GuessSkyObjectGame | null> {
    const count = await this.repository.count({ where: { isEnabled: true } });
    if (count === 0) return null;

    const seed = date.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    const index = seed % count;

    const game = await this.repository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.spaceSkyObject', 'spaceSkyObject')
      .where('game.isEnabled = :enabled', { enabled: true })
      .orderBy('game.id', 'ASC')
      .skip(index)
      .take(1)
      .getOne();

    if (game) {
      await this.dailyGameScheduleRepository.create(date, game);
    }

    return game;
  }

  async create(spaceSkyObjectId: number): Promise<GuessSkyObjectGame> {
    const entity = this.repository.create({ spaceSkyObject: { id: spaceSkyObjectId } as any });
    return this.repository.save(entity);
  }

  async toggleEnabled(id: number, isEnabled: boolean): Promise<void> {
    await this.repository.update(id, { isEnabled });
  }

  async incrementStats(id: number, attemptsUsed: number, won: boolean): Promise<void> {
    const game = await this.repository.findOneBy({ id });

    const totalPlayed = game.totalPlayed + 1;
    const totalWon = game.totalWon + (won ? 1 : 0);
    const totalLost = game.totalLost + (won ? 0 : 1);
    const totalAttemptsSum = game.avgAttemptsUsed * game.totalPlayed + attemptsUsed;

    const winCountByAttemptNumber = { ...game.winCountByAttemptNumber };
    if (won) {
      winCountByAttemptNumber[attemptsUsed] = (winCountByAttemptNumber[attemptsUsed] ?? 0) + 1;
    }

    await this.repository.update(id, {
      totalPlayed,
      totalWon,
      totalLost,
      winRate: Math.round((totalWon / totalPlayed) * 100 * 100) / 100,
      avgAttemptsUsed: Math.round((totalAttemptsSum / totalPlayed) * 100) / 100,
      winCountByAttemptNumber,
    });
  }
  
  async incrementAbandoned(id: number): Promise<void> {
    await this.repository.increment({ id }, 'totalAbandoned', 1);
  }
}