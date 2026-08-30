import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, In } from 'typeorm';
import { Personality } from './personality.entity';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { FilterService } from '../shared/filter/filter.service';
import { PersonalityQueryDto } from './DTO/personality-query-dto';

@Injectable()
export class PersonalityRepository {
  constructor(
    @InjectRepository(Personality)
    private readonly personalityRepository: Repository<Personality>,
    private readonly paginationService: PaginationService,
    private readonly filterService: FilterService,
  ) {}

  async findPaginated(options: PersonalityQueryDto): Promise<PaginationResult<Personality>> {
    let queryBuilder = this.personalityRepository.createQueryBuilder('personality');

    queryBuilder = this.filterService.applySearch(queryBuilder, options.search, [
      'personality.firstName',
      'personality.lastName',
      'personality.description',
    ]);

    const exactFilters: Array<{ field: string; value: unknown }> = [
      { field: 'personality.nationality', value: options.nationality },
      { field: 'personality.profession', value: options.profession },
    ];

    for (const { field, value } of exactFilters) {
      queryBuilder = this.filterService.applyExactFilter(queryBuilder, value, field);
    }

    queryBuilder = this.filterService.applyOrderFilter(
      queryBuilder,
      options.orderBy ? `personality.${options.orderBy}` : undefined,
      options.orderDirection,
    );

    return this.paginationService.paginate(queryBuilder, options);
  }

  async findOne(options: FindOneOptions<Personality>): Promise<Personality | null> {
    return this.personalityRepository.findOne(options);
  }

  async findOneById(id: number): Promise<Personality | null> {
    return this.personalityRepository.findOneBy({ id });
  }

  async findByIds(ids: number[]): Promise<Personality[]> {
    return this.personalityRepository.findBy({ id: In(ids) });
  }

  async createPersonality(data: Partial<Personality>): Promise<Personality> {
    const personality = this.personalityRepository.create(data);
    return this.personalityRepository.save(personality);
  }

  async updatePersonality(id: number, updateData: Partial<Personality>): Promise<Personality | null> {
    await this.personalityRepository.update(id, updateData);
    return this.findOneById(id);
  }

  async deletePersonality(id: number): Promise<void> {
    await this.personalityRepository.delete(id);
  }
}