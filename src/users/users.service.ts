
import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { ErrorMessage } from 'src/enum/error.enum';
import { updateUserDTO } from './DTO/update-user-dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) { }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.findAll();
  }

  async findOneById(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOneById(id);

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id : ${id} introuvable`);
    }

    return user
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneByEmail(email);
  }

  async createUser(createUserDTO: createUserDTO) {

    const { email, username, password } = createUserDTO;

    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDTO.email },
        { username: createUserDTO.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException(ErrorMessage.USERNAME_EMAIL_ALREADY_EXISTS);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const userToSave = {
      ...createUserDTO,
      password: hashedPassword,
    };

    try {
      return await this.usersRepository.createUser(userToSave);
    } catch (error) {
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);

    }
  }

  async updateUser(updateUserDTO: updateUserDTO, id: number, currentUser: User) {
    try {
      if (currentUser.id !== id) {
        throw new ForbiddenException("Vous ne pouvez modifier que votre propre compte.");
      }

      const updateUser = await this.usersRepository.findOneById(id);
      if (!updateUser) {
        throw new NotFoundException(ErrorMessage.USER_NOT_FOUND);
      }

      const existingUsername = await this.usersRepository.findOne({
        where: [{ username: updateUserDTO.username }],
      });

      if (existingUsername) {
        throw new ConflictException(ErrorMessage.USERNAME_ALREADY_EXISTS);
      }

      return this.usersRepository.updateUser(id, updateUserDTO);
    } catch (error) {
      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deleteUser(id: number) {
    return await this.usersRepository.deleteUser(id)
  }
}
