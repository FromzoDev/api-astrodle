import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOneByEmail(email: string): Promise<User | null> {
  return this.usersRepository.findOneBy({ email });
}

  async findOneById(id: number): Promise<User | null > {
    return this.usersRepository.findOneBy({ id });
  }

//   async createUser(userData: Partial<User>): Promise<User> {
//     const user = this.usersRepository.create(userData);
//     return this.usersRepository.save(user);
//   }

//   async updateUser(id: number, updateData: Partial<User>): Promise<User> {
//     await this.usersRepository.update(id, updateData);
//     return this.findOneById(id);
//   }

//   async deleteUser(id: number): Promise<void> {
//     await this.usersRepository.delete(id);
//   }
}
