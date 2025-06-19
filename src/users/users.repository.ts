import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

async findOne(options: FindOneOptions<User>): Promise<User | null> {
  return await this.usersRepository.findOne(options);
}

  async findOneByEmail(email: string): Promise<User | null> {
  return await this.usersRepository.findOneBy({ email });
}

  async findOneById(id: number): Promise<User | null > {
    return await this.usersRepository.findOneBy({ id });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = await this.usersRepository.create(userData);
    return await this.usersRepository.save(user);
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User | null> {
      await this.usersRepository.update(id, updateData);
    return await this.findOneById(id);
  }

  async deleteUser(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
