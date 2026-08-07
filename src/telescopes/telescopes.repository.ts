import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { Telescope } from './telescopes.entity';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { FilterService } from '../shared/filter/filter.service';
import { TelescopeQueryDto } from './DTO/telescope-query-dto';

@Injectable()
export class TelescopeRepository {
  constructor(
    @InjectRepository(Telescope)
    private readonly telescopeRepository: Repository<Telescope>,
    private readonly paginationService: PaginationService,
    private readonly filterService: FilterService,
  ) {}

  async findPaginated(options: TelescopeQueryDto): Promise<PaginationResult<Telescope>> {
    let queryBuilder = this.telescopeRepository
      .createQueryBuilder('telescope')
      .leftJoinAndSelect('telescope.spaceOrganisations', 'spaceOrganisation');

    queryBuilder = this.filterService.applySearch(queryBuilder, options.search, [
      'telescope.name',
    ]);

    const exactFilters: Array<{ field: string; value: unknown }> = [
      { field: 'telescope.telescopeLocation', value: options.telescopeLocation },
      { field: 'telescope.telescopeSpectrum', value: options.telescopeSpectrum },
    ];

    for (const { field, value } of exactFilters) {
      queryBuilder = this.filterService.applyExactFilter(queryBuilder, value, field);
    }

    if (options.spaceOrganisationId !== undefined) {
      queryBuilder.andWhere('spaceOrganisation.id = :spaceOrganisationId', {
        spaceOrganisationId: options.spaceOrganisationId,
      });
    }

    queryBuilder = this.filterService.applyOrderFilter(
      queryBuilder,
      options.orderBy,
      options.orderDirection,
    );

    return this.paginationService.paginate(queryBuilder, options);
  }

  async findOne(options: FindOneOptions<Telescope>): Promise<Telescope | null> {
    return this.telescopeRepository.findOne(options);
  }

  async findOneById(id: number): Promise<Telescope | null> {
    return this.telescopeRepository.findOne({
      where: { id },
      relations: ['spaceOrganisations'],
    });
  }

  async createTelescope(data: Partial<Telescope>): Promise<Telescope> {
    const telescope = this.telescopeRepository.create(data);
    return this.telescopeRepository.save(telescope);
  }

  async updateTelescope(id: number, updateData: Partial<Telescope>): Promise<Telescope | null> {
    await this.telescopeRepository.save({ id, ...updateData });
    return this.findOneById(id);
  }

  async deleteTelescope(id: number): Promise<void> {
    await this.telescopeRepository.delete(id);
  }
}