
import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { ErrorMessage } from 'src/enum/error.enum';
import { updateUserDTO } from './DTO/update-user-dto';


  @Injectable()
  export class UsersService { constructor(private readonly usersRepository: UsersRepository) {}
    
    async findAll(): Promise<User[]> {
      return await this.usersRepository.findAll();
    }

    async findOneById(id: number): Promise<User | null> {
      return await this.usersRepository.findOneById(id);
    }
      
    async findOneByEmail(email: string): Promise<User | null> {
        return await this.usersRepository.findOneByEmail(email);
    }

    async createUser(createUserDTO: createUserDTO){
      const existingUser = await this.usersRepository.findOne({
        where: [
          { email: createUserDTO.email },
          { username: createUserDTO.username },
        ],
      });

      if(existingUser){
        throw new ConflictException(ErrorMessage.USERNAME_EMAIL_ALREADY_EXISTS);
      }

      try {
        return await this.usersRepository.createUser(createUserDTO);
      } catch (error){
        throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
      
      }
    }

    async updateUser(updateUserDTO: updateUserDTO, id: number, currentUser: User) {
      const updateUser = await this.usersRepository.findOneById(id);
      const existingUsername = await this.usersRepository.findOne({
        where: [
          { username: updateUserDTO.username },
        ],
      });

      if (currentUser.id !== id) {
        throw new ForbiddenException("Vous ne pouvez modifier que votre propre compte.");
      }

      if (!updateUser) {
        throw new NotFoundException(ErrorMessage.USER_NOT_FOUND);
      }

      if(existingUsername){
        throw new ConflictException(ErrorMessage.USERNAME_ALREADY_EXISTS);
      }

      try{
        return this.usersRepository.updateUser(id, updateUserDTO);
       } catch (error) {
        throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
       }

    }
}
