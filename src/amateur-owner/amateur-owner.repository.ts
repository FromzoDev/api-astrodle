import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, In } from 'typeorm';
import { AmateurOwner } from './amateur-owner.entity';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { FilterService } from '../shared/filter/filter.service';
import { AmateurOwnerQueryDto } from './DTO/amateur-owner-query-dto';

@Injectable()
export class AmateurOwnerRepository {
  constructor(
    @InjectRepository(AmateurOwner)
    private readonly amateurOwnerRepository: Repository<AmateurOwner>,
    private readonly paginationService: PaginationService,
    private readonly filterService: FilterService,
  ) {}

  async findPaginated(
    options: AmateurOwnerQueryDto,
  ): Promise<PaginationResult<AmateurOwner>> {
    let queryBuilder =
      this.amateurOwnerRepository.createQueryBuilder('amateurOwner');

    queryBuilder = this.filterService.applySearch(
      queryBuilder,
      options.search,
      ['amateurOwner.firstName', 'amateurOwner.lastName'],
    );

    queryBuilder = this.filterService.applyOrderFilter(
      queryBuilder,
      options.orderBy ? `amateurOwner.${options.orderBy}` : undefined,
      options.orderDirection,
    );

    const result = await this.paginationService.paginate(queryBuilder, options);

    if (result.items.length === 0) {
      return result;
    }

    const withTelescopes = await this.amateurOwnerRepository.find({
      where: { id: In(result.items.map((item) => item.id)) },
      relations: ['telescopes'],
    });
    const telescopesById = new Map(
      withTelescopes.map((amateurOwner) => [
        amateurOwner.id,
        amateurOwner.telescopes,
      ]),
    );

    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        telescopes: telescopesById.get(item.id) ?? [],
      })),
    };
  }

  async findOne(
    options: FindOneOptions<AmateurOwner>,
  ): Promise<AmateurOwner | null> {
    return this.amateurOwnerRepository.findOne(options);
  }

  async findOneById(id: number): Promise<AmateurOwner | null> {
    return this.amateurOwnerRepository.findOne({
      where: { id },
      relations: ['telescopes'],
    });
  }

  async createAmateurOwner(data: Partial<AmateurOwner>): Promise<AmateurOwner> {
    const amateurOwner = this.amateurOwnerRepository.create(data);
    return this.amateurOwnerRepository.save(amateurOwner);
  }

  async updateAmateurOwner(
    id: number,
    updateData: Partial<AmateurOwner>,
  ): Promise<AmateurOwner | null> {
    await this.amateurOwnerRepository.update(id, updateData);
    return this.findOneById(id);
  }

  async deleteAmateurOwner(id: number): Promise<void> {
    await this.amateurOwnerRepository.delete(id);
  }
}
