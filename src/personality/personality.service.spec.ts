import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PersonalityService } from './personality.service';
import { PersonalityRepository } from './personality.repository';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { Personality } from './personality.entity';
import { createPersonalityDTO } from './DTO/create-personality-dto';
import { updatePersonalityDTO } from './DTO/update-personality-dto';
import { PersonalityQueryDto } from './DTO/personality-query-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { Country } from '../common/enum/country.enum';
import { Profession } from '../common/enum/profession.enum';
import { MulterFile } from '../types/multer-file.type';

describe('PersonalityService', () => {
  let service: PersonalityService;
  let repository: jest.Mocked<PersonalityRepository>;
  let imageUploadService: jest.Mocked<ImageUploadService>;

  const buildPersonality = (
    overrides: Partial<Personality> = {},
  ): Personality => ({
    id: 1,
    firstName: 'Galileo',
    lastName: 'Galilei',
    dateOfBirth: new Date('1564-02-15'),
    dateOfDeath: new Date('1642-01-08'),
    nationality: Country.Italy,
    profession: Profession.Astronomer,
    description: 'Astronome italien',
    personalityImage: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const buildFile = (overrides: Partial<MulterFile> = {}): MulterFile => ({
    fieldname: 'file',
    originalname: 'photo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake'),
    ...overrides,
  });

  beforeEach(async () => {
    const repositoryMock = {
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      createPersonality: jest.fn(),
      updatePersonality: jest.fn(),
      deletePersonality: jest.fn(),
    };

    const imageUploadServiceMock = {
      uploadImage: jest.fn(),
      deleteImageByUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalityService,
        { provide: PersonalityRepository, useValue: repositoryMock },
        { provide: ImageUploadService, useValue: imageUploadServiceMock },
      ],
    }).compile();

    service = module.get<PersonalityService>(PersonalityService);
    repository = module.get(PersonalityRepository);
    imageUploadService = module.get(ImageUploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPaginated', () => {
    it('returns the paginated result from the repository', async () => {
      const options: PersonalityQueryDto = { page: 1, limit: 20 };
      const paginated: PaginationResult<Personality> = {
        items: [buildPersonality()],
        total: 1,
        page: 1,
        limit: 20,
        lastPage: 1,
      };
      repository.findPaginated.mockResolvedValue(paginated);

      const result = await service.findPaginated(options);

      expect(result).toEqual(paginated);
      expect(repository.findPaginated).toHaveBeenCalledWith(options);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      const options: PersonalityQueryDto = { page: 1, limit: 20 };
      repository.findPaginated.mockRejectedValue(new Error('db down'));

      await expect(service.findPaginated(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneById', () => {
    it('returns the personality when found', async () => {
      const personality = buildPersonality();
      repository.findOneById.mockResolvedValue(personality);

      const result = await service.findOneById(1);

      expect(result).toEqual(personality);
      expect(repository.findOneById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the personality does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockRejectedValue(new Error('db down'));

      await expect(service.findOneById(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createPersonality', () => {
    const dto: createPersonalityDTO = {
      firstName: 'Galileo',
      lastName: 'Galilei',
      dateOfBirth: '1564-02-15',
      dateOfDeath: '1642-01-08',
      nationality: Country.Italy,
      profession: Profession.Astronomer,
      description: 'Astronome italien',
    };

    it('creates the personality without uploading an image when no file is provided', async () => {
      const created = buildPersonality();
      repository.createPersonality.mockResolvedValue(created);

      const result = await service.createPersonality(dto);

      expect(result).toEqual(created);
      expect(repository.createPersonality).toHaveBeenCalledWith({
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        dateOfDeath: new Date(dto.dateOfDeath as string),
      });
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('uploads the image and updates the personality when a file is provided', async () => {
      const created = buildPersonality();
      const file = buildFile();
      const imageUrl = 'https://minio.example.com/bucket/personalities/1/img.png';
      const updated = buildPersonality({ personalityImage: imageUrl });
      repository.createPersonality.mockResolvedValue(created);
      imageUploadService.uploadImage.mockResolvedValue(imageUrl);
      repository.updatePersonality.mockResolvedValue(updated);

      const result = await service.createPersonality(dto, file);

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'personalities',
        created.id,
        { maxSizeMb: 100 },
      );
      expect(repository.updatePersonality).toHaveBeenCalledWith(created.id, {
        personalityImage: imageUrl,
      });
      expect(result).toEqual(updated);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.createPersonality.mockRejectedValue(new Error('db down'));

      await expect(service.createPersonality(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('wraps unexpected image upload errors in InternalServerErrorException', async () => {
      const created = buildPersonality();
      const file = buildFile();
      repository.createPersonality.mockResolvedValue(created);
      imageUploadService.uploadImage.mockRejectedValue(new Error('minio down'));

      await expect(service.createPersonality(dto, file)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updatePersonality', () => {
    it('updates the personality when found and no file is provided', async () => {
      const existing = buildPersonality();
      const dto: updatePersonalityDTO = { firstName: 'Galileo Junior' };
      const updated = buildPersonality({ firstName: 'Galileo Junior' });
      repository.findOneById.mockResolvedValue(existing);
      repository.updatePersonality.mockResolvedValue(updated);

      const result = await service.updatePersonality(1, dto);

      expect(result).toEqual(updated);
      expect(repository.updatePersonality).toHaveBeenCalledWith(1, {
        ...dto,
      });
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('uploads the file and includes the new image when updating', async () => {
      const existing = buildPersonality();
      const file = buildFile();
      const imageUrl = 'https://minio.example.com/bucket/personalities/1/new.png';
      const updated = buildPersonality({ personalityImage: imageUrl });
      repository.findOneById.mockResolvedValue(existing);
      imageUploadService.uploadImage.mockResolvedValue(imageUrl);
      repository.updatePersonality.mockResolvedValue(updated);

      const result = await service.updatePersonality(1, {}, file);

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'personalities',
        1,
        { maxSizeMb: 100 },
      );
      expect(repository.updatePersonality).toHaveBeenCalledWith(1, {
        personalityImage: imageUrl,
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when the personality does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(
        service.updatePersonality(999, { firstName: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updatePersonality).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the update returns null', async () => {
      const existing = buildPersonality();
      repository.findOneById.mockResolvedValue(existing);
      repository.updatePersonality.mockResolvedValue(null);

      await expect(
        service.updatePersonality(1, { firstName: 'Galileo Junior' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockRejectedValue(new Error('db down'));

      await expect(
        service.updatePersonality(1, { firstName: 'Galileo Junior' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deletePersonality', () => {
    it('deletes the personality when found', async () => {
      const existing = buildPersonality();
      repository.findOneById.mockResolvedValue(existing);
      repository.deletePersonality.mockResolvedValue(undefined);

      await service.deletePersonality(1);

      expect(repository.deletePersonality).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the personality does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.deletePersonality(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deletePersonality).not.toHaveBeenCalled();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      const existing = buildPersonality();
      repository.findOneById.mockResolvedValue(existing);
      repository.deletePersonality.mockRejectedValue(new Error('db down'));

      await expect(service.deletePersonality(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
