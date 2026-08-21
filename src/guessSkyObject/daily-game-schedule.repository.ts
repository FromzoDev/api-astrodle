import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { DailyGameSchedule } from './daily-game-schedule.entity';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';
import { DailyGameScheduleQueryDto } from './DTO/daily-game-schedule-query-dto';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';

@Injectable()
export class DailyGameScheduleRepository {
  constructor(
    @InjectRepository(DailyGameSchedule)
    private readonly repository: Repository<DailyGameSchedule>,
    private readonly paginationService: PaginationService,
  ) {}

  async findByDate(date: string): Promise<DailyGameSchedule | null> {
    return this.repository.findOne({
      where: { date },
      relations: ['guessSkyObjectGame', 'guessSkyObjectGame.spaceSkyObject'],
    });
  }

  async create(date: string, guessSkyObjectGame: GuessSkyObjectGame): Promise<DailyGameSchedule | null> {
    try {
      const schedule = this.repository.create({ date, guessSkyObjectGame });
      return await this.repository.save(schedule);
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.includes('duplicate')) {
        return this.findByDate(date);
      }
      throw error;
    }
  }

  async findPaginated(options: DailyGameScheduleQueryDto): Promise<PaginationResult<DailyGameSchedule>> {
    const queryBuilder = this.repository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.guessSkyObjectGame', 'game')
      .leftJoinAndSelect('game.spaceSkyObject', 'spaceSkyObject')
      .orderBy('schedule.date', 'DESC');

    return this.paginationService.paginate(queryBuilder, options);
  }
}