
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';


  @Injectable()
  export class UsersService { constructor(private readonly usersRepository: UsersRepository) {}
    
    async findAll(): Promise<User[]> {
      return this.usersRepository.findAll();
    }

    async findOneById(id: number): Promise<User | null> {
      return this.usersRepository.findOneById(id);
    }
      
    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOneByEmail(email);
    }    

  }
