import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PaginationResult } from './pagination.interface';
import { PaginationDto } from './pagination-dto';

@Injectable()
export class PaginationService {
  async paginate<DataType extends object>(
    querybuilder: SelectQueryBuilder<DataType>,
    options: PaginationDto,
  ): Promise<PaginationResult<DataType>> {

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await querybuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }
}