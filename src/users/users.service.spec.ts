import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { User } from './user.entity';
import { Role } from '../common/enum/roles.enum';
import { createUserDTO } from './DTO/create-user-dto';
import { updateUserDTO } from './DTO/update-user-dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { userQueryDto } from './DTO/user-query-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { MulterFile } from '../types/multer-file.type';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<
      UsersRepository,
      | 'findPaginated'
      | 'findOne'
      | 'findOneByEmail'
      | 'findOneById'
      | 'createUser'
      | 'updateUser'
      | 'deleteUser'
    >
  >;
  let imageUploadService: jest.Mocked<Pick<ImageUploadService, 'uploadImage'>>;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      profilePicture: null,
      password: 'hashed-password',
      roles: [Role.User],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  beforeEach(async () => {
    usersRepository = {
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      findOneByEmail: jest.fn(),
      findOneById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    imageUploadService = {
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: ImageUploadService, useValue: imageUploadService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findPaginated', () => {
    it('returns the paginated result from the repository', async () => {
      const paginated: PaginationResult<User> = {
        items: [buildUser()],
        total: 1,
        page: 1,
        limit: 10,
        lastPage: 1,
      };
      usersRepository.findPaginated.mockResolvedValue(paginated);

      const result = await service.findPaginated({} as userQueryDto);

      expect(result).toEqual(paginated);
    });

    it('wraps repository errors in InternalServerErrorException', async () => {
      usersRepository.findPaginated.mockRejectedValue(new Error('db down'));

      await expect(service.findPaginated({} as userQueryDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneById', () => {
    it('returns the user when found', async () => {
      const user = buildUser();
      usersRepository.findOneById.mockResolvedValue(user);

      const result = await service.findOneById(1);

      expect(result).toEqual(user);
    });

    it('throws NotFoundException when not found', async () => {
      usersRepository.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByEmail', () => {
    it('returns the user when found', async () => {
      const user = buildUser();
      usersRepository.findOneByEmail.mockResolvedValue(user);

      const result = await service.findOneByEmail(user.email);

      expect(result).toEqual(user);
    });

    it('throws NotFoundException when not found', async () => {
      usersRepository.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.findOneByEmail('missing@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    const dto: createUserDTO = {
      email: 'new@example.com',
      password: 'plain-password',
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'janedoe',
      roles: [Role.User],
    };

    it('creates the user without a file', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-password'));
      const created = buildUser({ email: dto.email, username: dto.username });
      usersRepository.createUser.mockResolvedValue(created);

      const result = await service.createUser(dto);

      expect(result).toEqual(created);
      expect(usersRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          password: 'hashed-password',
        }),
      );
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('throws ConflictException when email or username already exists', async () => {
      usersRepository.findOne.mockResolvedValue(buildUser());

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('uploads the avatar and updates the user when a file is provided', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-password'));
      const created = buildUser();
      usersRepository.createUser.mockResolvedValue(created);
      imageUploadService.uploadImage.mockResolvedValue('https://cdn/avatar.png');
      const updated = buildUser({ profilePicture: 'https://cdn/avatar.png' });
      usersRepository.updateUser.mockResolvedValue(updated);

      const file = {
        originalname: 'avatar.png',
        size: 10,
        mimetype: 'image/png',
      } as MulterFile;

      const result = await service.createUser(dto, file);

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'users',
        created.id,
        { maxSizeMb: 100 },
      );
      expect(usersRepository.updateUser).toHaveBeenCalledWith(created.id, {
        profilePicture: 'https://cdn/avatar.png',
      });
      expect(result).toEqual(updated);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('db down'));

      await expect(service.createUser(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateUser', () => {
    const dto: updateUserDTO = { firstName: 'Updated' };
    const currentUser: JwtPayload = { sub: 1, roles: [Role.User] };

    it('updates the user on the happy path', async () => {
      const existing = buildUser();
      usersRepository.findOneById.mockResolvedValue(existing);
      const updated = buildUser({ firstName: 'Updated' });
      usersRepository.updateUser.mockResolvedValue(updated);

      const result = await service.updateUser(dto, 1, currentUser);

      expect(result).toEqual(updated);
      expect(usersRepository.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ firstName: 'Updated' }),
      );
    });

    it('throws ForbiddenException when a non-admin tries to modify another user', async () => {
      const otherUser: JwtPayload = { sub: 2, roles: [Role.User] };

      await expect(service.updateUser(dto, 1, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(usersRepository.findOneById).not.toHaveBeenCalled();
    });

    it('allows an admin to modify another user', async () => {
      const admin: JwtPayload = { sub: 2, roles: [Role.Admin] };
      const existing = buildUser();
      usersRepository.findOneById.mockResolvedValue(existing);
      const updated = buildUser({ firstName: 'Updated' });
      usersRepository.updateUser.mockResolvedValue(updated);

      const result = await service.updateUser(dto, 1, admin);

      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when the target user does not exist', async () => {
      usersRepository.findOneById.mockResolvedValue(null);

      await expect(service.updateUser(dto, 1, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when the new username is already taken by someone else', async () => {
      const existing = buildUser();
      usersRepository.findOneById.mockResolvedValue(existing);
      usersRepository.findOne.mockResolvedValue(buildUser({ id: 2 }));

      await expect(
        service.updateUser({ username: 'taken' }, 1, currentUser),
      ).rejects.toThrow(ConflictException);
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });

    it('uploads a new avatar when a file is provided', async () => {
      const existing = buildUser();
      usersRepository.findOneById.mockResolvedValue(existing);
      imageUploadService.uploadImage.mockResolvedValue('https://cdn/new-avatar.png');
      const updated = buildUser({ profilePicture: 'https://cdn/new-avatar.png' });
      usersRepository.updateUser.mockResolvedValue(updated);

      const file = {
        originalname: 'avatar.png',
        size: 10,
        mimetype: 'image/png',
      } as MulterFile;

      const result = await service.updateUser(dto, 1, currentUser, file);

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'users',
        1,
        { maxSizeMb: 100 },
      );
      expect(usersRepository.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ profilePicture: 'https://cdn/new-avatar.png' }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe('deleteUser', () => {
    it('deletes the user on the happy path', async () => {
      usersRepository.deleteUser.mockResolvedValue(undefined);

      await service.deleteUser(1);

      expect(usersRepository.deleteUser).toHaveBeenCalledWith(1);
    });

    it('wraps repository errors in InternalServerErrorException', async () => {
      usersRepository.deleteUser.mockRejectedValue(new Error('db down'));

      await expect(service.deleteUser(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
