import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, In } from 'typeorm';
import { SpaceSkyObject } from './space-sky-object.entity';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { FilterService } from '../shared/filter/filter.service';
import { SpaceSkyObjectQueryDto } from './DTO/space-sky-object-query-dto';

@Injectable()
export class SpaceSkyObjectRepository {
  constructor(
    @InjectRepository(SpaceSkyObject)
    private readonly spaceSkyObjectRepository: Repository<SpaceSkyObject>,
    private readonly paginationService: PaginationService,
    private readonly filterService: FilterService,
  ) {}

  async findPaginated(
    options: SpaceSkyObjectQueryDto,
  ): Promise<PaginationResult<SpaceSkyObject>> {
    let queryBuilder = this.spaceSkyObjectRepository
      .createQueryBuilder('spaceSkyObject')
      .leftJoinAndSelect('spaceSkyObject.discoverer', 'discoverer')
      .leftJoinAndSelect('spaceSkyObject.telescope', 'telescope');

    queryBuilder = this.filterService.applySearch(
      queryBuilder,
      options.search,
      [
        'spaceSkyObject.name',
        'spaceSkyObject.constellationName',
        'spaceSkyObject.description',
      ],
    );

    const exactFilters: Array<{ field: string; value: unknown }> = [
      { field: 'spaceSkyObject.objectType', value: options.objectType },
    ];

    for (const { field, value } of exactFilters) {
      queryBuilder = this.filterService.applyExactFilter(
        queryBuilder,
        value,
        field,
      );
    }

    if (options.discovererId !== undefined) {
      queryBuilder.andWhere('discoverer.id = :discovererId', {
        discovererId: options.discovererId,
      });
    }

    if (options.telescopeId !== undefined) {
      queryBuilder.andWhere('telescope.id = :telescopeId', {
        telescopeId: options.telescopeId,
      });
    }

    queryBuilder = this.filterService.applyOrderFilter(
      queryBuilder,
      options.orderBy ? `spaceSkyObject.${options.orderBy}` : undefined,
      options.orderDirection,
    );

    return this.paginationService.paginate(queryBuilder, options);
  }

  async findOne(
    options: FindOneOptions<SpaceSkyObject>,
  ): Promise<SpaceSkyObject | null> {
    return this.spaceSkyObjectRepository.findOne(options);
  }

  async findOneById(id: number): Promise<SpaceSkyObject | null> {
    return this.spaceSkyObjectRepository.findOne({
      where: { id },
      relations: ['discoverer', 'telescope'],
    });
  }

  async createSpaceSkyObject(
    data: Partial<SpaceSkyObject>,
  ): Promise<SpaceSkyObject> {
    const spaceSkyObject = this.spaceSkyObjectRepository.create(data);
    return this.spaceSkyObjectRepository.save(spaceSkyObject);
  }

  async updateSpaceSkyObject(
    id: number,
    updateData: Partial<SpaceSkyObject>,
  ): Promise<SpaceSkyObject | null> {
    await this.spaceSkyObjectRepository.save({ id, ...updateData });
    return this.findOneById(id);
  }

  async deleteSpaceSkyObject(id: number): Promise<void> {
    await this.spaceSkyObjectRepository.delete(id);
  }
}
