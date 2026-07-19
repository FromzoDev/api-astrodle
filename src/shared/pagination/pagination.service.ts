import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository ,  } from 'typeorm';
import { PaginationResult } from './pagination.interface';
import { PaginationDto } from './pagination-dto';


@Injectable()
export class PaginationService {
  async paginate<DataType>(
    repository: Repository<DataType>,
    options: PaginationDto,
    findOptions?: FindManyOptions<DataType>
  ): Promise<PaginationResult<DataType>> {

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await repository.findAndCount({
      ...findOptions,
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }
}
