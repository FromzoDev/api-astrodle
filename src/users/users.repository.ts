import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from './user.entity';
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationDto } from '../shared/pagination/pagination-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { userQueryDto } from './DTO/user-query-dto';
import { FilterService } from '../shared/filter/filter.service';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly paginationService: PaginationService,
    private readonly filterService: FilterService,
  ) {}

  async findPaginated(options: userQueryDto): Promise<PaginationResult<User>> {
    let queryBuilder = this.usersRepository.createQueryBuilder('user');

    queryBuilder = this.filterService.applySearch(
      queryBuilder,
      options.search,
      ['user.firstName', 'user.lastName', 'user.email', 'user.username'],
    );

    const exactFilters: Array<{ field: string; value: unknown }> = [
      { field: 'user.isActive', value: options.isActive },
      { field: 'user.firstName', value: options.firstName },
      { field: 'user.lastName', value: options.lastName },
      { field: 'user.email', value: options.email },
      { field: 'user.username', value: options.username },
    ];

    for (const { field, value } of exactFilters) {
      queryBuilder = this.filterService.applyExactFilter(
        queryBuilder,
        value,
        field,
      );
    }

    queryBuilder = this.filterService.applyArrayContainsFilter(
      queryBuilder,
      options.role,
      'user.roles',
    );

    queryBuilder = this.filterService.applyOrderFilter(
      queryBuilder,
      options.orderBy ? `user.${options.orderBy}` : undefined,
      options.orderDirection,
    );

    return this.paginationService.paginate(queryBuilder, options);
  }

  async findOne(options: FindOneOptions<User>): Promise<User | null> {
    return await this.usersRepository.findOne(options);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async findOneById(id: number): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = await this.usersRepository.create(userData);
    return await this.usersRepository.save(user);
  }

  async updateUser(
    id: number,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return await this.findOneById(id);
  }

  async deleteUser(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
