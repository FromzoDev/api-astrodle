import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { ErrorMessage } from '../common/enum/error.enum';
import { updateUserDTO } from './DTO/update-user-dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enum/roles.enum';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { userQueryDto } from './DTO/user-query-dto';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { MulterFile } from '../types/multer-file.type';


@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly imageUploadService: ImageUploadService
  ) { }

  async findPaginated(options: userQueryDto): Promise<PaginationResult<User>> {
    try {
      return await this.usersRepository.findPaginated(options);
    } catch (error) {

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneById(id: number): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOneById(id);

      if (!user) {
        throw new NotFoundException(ErrorMessage.USER_NOT_FOUND);
      }

      return user

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOneByEmail(email);

      if (!user) {
        throw new NotFoundException(ErrorMessage.USER_NOT_FOUND);
      }

      return user
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }

  }

  async createUser(createUserDTO: createUserDTO, file?: MulterFile): Promise<User> {

    try {
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

      const savedUser = await this.usersRepository.createUser(userToSave);

      if (file && savedUser) {
        const avatarUrl = await this.imageUploadService.uploadImage(file, 'users', savedUser.id, {
          maxSizeMb: 100,
        });

        return await this.usersRepository.updateUser(savedUser.id, { profilePicture: avatarUrl });
      }

      return savedUser;

    } catch (error) {

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);

    }
  }
  
  async updateUser( updateUserDTO: updateUserDTO, id: number, currentUser: User, file?: MulterFile, ): Promise<User> {
    try {
      this.logger.debug(
        `updateUser(${id}) isActive=${updateUserDTO.isActive} (type: ${typeof updateUserDTO.isActive})`,
      );

      if (currentUser.id !== id && !currentUser.roles.includes(Role.Admin)) {
        throw new ForbiddenException(ErrorMessage.USER_CANNOT_MODIFY_OTHER);
      }

      const updateUser = await this.usersRepository.findOneById(id);

      if (!updateUser) {
        throw new NotFoundException(ErrorMessage.USER_NOT_FOUND);
      }

      if (updateUserDTO.username) {
        const existingUsername = await this.usersRepository.findOne({
          where: [{ username: updateUserDTO.username }],
        });

        if (existingUsername && existingUsername.id !== id) {
          throw new ConflictException(ErrorMessage.USERNAME_ALREADY_EXISTS);
        }
      }

      let avatarUrl: string | undefined;

      if (file) {
        avatarUrl = await this.imageUploadService.uploadImage(file, 'users', id, {
          maxSizeMb: 100,
        });
      }

      return this.usersRepository.updateUser(id, {
        ...updateUserDTO,
        ...(avatarUrl && { avatarUrl }),
      });

    } catch (error) {

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deleteUser(id: number): Promise<void> {

    try {
      return await this.usersRepository.deleteUser(id)
    } catch (error) {

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.DELETE_ERROR_MESSAGE);
    }

  }
}
