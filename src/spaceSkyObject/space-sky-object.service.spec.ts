import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpaceSkyObjectService } from './space-sky-object.service';
import { SpaceSkyObjectRepository } from './space-sky-object.repository';
import { PersonalityRepository } from '../personality/personality.repository';
import { TelescopeRepository } from '../telescopes/telescopes.repository';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { SpaceSkyObject } from './space-sky-object.entity';
import { ObjectType } from '../common/enum/object-type.enum';
import { Personality } from '../personality/personality.entity';
import { Telescope } from '../telescopes/telescopes.entity';
import { MulterFile } from '../types/multer-file.type';
import { PaginationResult } from '../shared/pagination/pagination.interface';

describe('SpaceSkyObjectService', () => {
  let service: SpaceSkyObjectService;
  let repository: jest.Mocked<SpaceSkyObjectRepository>;
  let personalityRepository: jest.Mocked<PersonalityRepository>;
  let telescopeRepository: jest.Mocked<TelescopeRepository>;
  let imageUploadService: jest.Mocked<ImageUploadService>;

  const buildSkyObject = (
    overrides: Partial<SpaceSkyObject> = {},
  ): SpaceSkyObject =>
    ({
      id: 1,
      name: 'Jupiter',
      constellationName: 'N/A',
      discoveryDate: new Date('1610-01-07'),
      objectType: ObjectType.Planet,
      magnitude: -2.9,
      distanceLightYears: 0,
      description: 'La plus grosse planète du système solaire',
      discoverer: undefined,
      telescope: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as SpaceSkyObject;

  const buildFile = (overrides: Partial<MulterFile> = {}): MulterFile =>
    ({
      fieldname: 'image',
      originalname: 'jupiter.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 2048,
      buffer: Buffer.from('fake'),
      ...overrides,
    }) as MulterFile;

  const validCreateDto = {
    name: 'Jupiter',
    constellationName: 'N/A',
    discoveryDate: '1610-01-07',
    objectType: ObjectType.Planet,
    magnitude: -2.9,
    distanceLightYears: 0,
    description: 'desc',
  };

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<SpaceSkyObjectRepository>> = {
      findPaginated: jest.fn(),
      findOneById: jest.fn(),
      createSpaceSkyObject: jest.fn(),
      updateSpaceSkyObject: jest.fn(),
      deleteSpaceSkyObject: jest.fn(),
    };
    const personalityRepositoryMock: Partial<
      jest.Mocked<PersonalityRepository>
    > = {
      findOneById: jest.fn(),
    };
    const telescopeRepositoryMock: Partial<jest.Mocked<TelescopeRepository>> =
      {
        findOneById: jest.fn(),
      };
    const imageUploadServiceMock: Partial<jest.Mocked<ImageUploadService>> = {
      uploadImage: jest.fn(),
      deleteImageByUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceSkyObjectService,
        { provide: SpaceSkyObjectRepository, useValue: repositoryMock },
        {
          provide: PersonalityRepository,
          useValue: personalityRepositoryMock,
        },
        { provide: TelescopeRepository, useValue: telescopeRepositoryMock },
        { provide: ImageUploadService, useValue: imageUploadServiceMock },
      ],
    }).compile();

    service = module.get<SpaceSkyObjectService>(SpaceSkyObjectService);
    repository = module.get(SpaceSkyObjectRepository);
    personalityRepository = module.get(PersonalityRepository);
    telescopeRepository = module.get(TelescopeRepository);
    imageUploadService = module.get(ImageUploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPaginated', () => {
    it('returns the paginated result from the repository', async () => {
      const result: PaginationResult<SpaceSkyObject> = {
        items: [buildSkyObject()],
        total: 1,
        page: 1,
        limit: 20,
        lastPage: 1,
      };
      repository.findPaginated.mockResolvedValue(result);

      const options = { page: 1, limit: 20 };
      const output = await service.findPaginated(options as any);

      expect(output).toEqual(result);
      expect(repository.findPaginated).toHaveBeenCalledWith(options);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findPaginated.mockRejectedValue(new Error('db down'));

      await expect(service.findPaginated({} as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneById', () => {
    it('returns the sky object when found', async () => {
      const skyObject = buildSkyObject();
      repository.findOneById.mockResolvedValue(skyObject);

      const result = await service.findOneById(1);

      expect(result).toEqual(skyObject);
    });

    it('throws NotFoundException when not found', async () => {
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

  describe('createSpaceSkyObject', () => {
    it('creates a sky object without discoverer, telescope or file', async () => {
      const created = buildSkyObject();
      repository.createSpaceSkyObject.mockResolvedValue(created);

      const result = await service.createSpaceSkyObject(
        validCreateDto as any,
      );

      expect(result).toEqual(created);
      expect(personalityRepository.findOneById).not.toHaveBeenCalled();
      expect(telescopeRepository.findOneById).not.toHaveBeenCalled();
      expect(repository.createSpaceSkyObject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jupiter',
          objectType: ObjectType.Planet,
        }),
      );
    });

    it('resolves the discoverer when discovererId is provided', async () => {
      const discoverer = { id: 7, name: 'Galileo' } as unknown as Personality;
      personalityRepository.findOneById.mockResolvedValue(discoverer);
      repository.createSpaceSkyObject.mockResolvedValue(buildSkyObject());

      await service.createSpaceSkyObject({
        ...validCreateDto,
        discovererId: 7,
      } as any);

      expect(personalityRepository.findOneById).toHaveBeenCalledWith(7);
      expect(repository.createSpaceSkyObject).toHaveBeenCalledWith(
        expect.objectContaining({ discoverer }),
      );
    });

    it('throws BadRequestException when the discoverer is not found', async () => {
      personalityRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.createSpaceSkyObject({
          ...validCreateDto,
          discovererId: 999,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createSpaceSkyObject).not.toHaveBeenCalled();
    });

    it('resolves the telescope when telescopeId is provided', async () => {
      const telescope = { id: 3, name: 'Hubble' } as unknown as Telescope;
      telescopeRepository.findOneById.mockResolvedValue(telescope);
      repository.createSpaceSkyObject.mockResolvedValue(buildSkyObject());

      await service.createSpaceSkyObject({
        ...validCreateDto,
        telescopeId: 3,
      } as any);

      expect(telescopeRepository.findOneById).toHaveBeenCalledWith(3);
      expect(repository.createSpaceSkyObject).toHaveBeenCalledWith(
        expect.objectContaining({ telescope }),
      );
    });

    it('throws BadRequestException when the telescope is not found', async () => {
      telescopeRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.createSpaceSkyObject({
          ...validCreateDto,
          telescopeId: 999,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createSpaceSkyObject).not.toHaveBeenCalled();
    });

    it('uploads the image and updates the sky object when a file is provided', async () => {
      const created = buildSkyObject({ id: 5 });
      const updated = buildSkyObject({
        id: 5,
        objectImage: 'https://cdn/jupiter.png',
      });
      repository.createSpaceSkyObject.mockResolvedValue(created);
      imageUploadService.uploadImage.mockResolvedValue(
        'https://cdn/jupiter.png',
      );
      repository.updateSpaceSkyObject.mockResolvedValue(updated);

      const file = buildFile();
      const result = await service.createSpaceSkyObject(
        validCreateDto as any,
        file,
      );

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'space-sky-objects',
        5,
        { maxSizeMb: 100 },
      );
      expect(repository.updateSpaceSkyObject).toHaveBeenCalledWith(5, {
        objectImage: 'https://cdn/jupiter.png',
      });
      expect(result).toEqual(updated);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.createSpaceSkyObject.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        service.createSpaceSkyObject(validCreateDto as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateSpaceSkyObject', () => {
    it('throws NotFoundException when the sky object does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(
        service.updateSpaceSkyObject(999, {} as any),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateSpaceSkyObject).not.toHaveBeenCalled();
    });

    it('updates the sky object keeping the existing discoverer/telescope when not provided', async () => {
      const existing = buildSkyObject();
      const updated = buildSkyObject({ name: 'Jupiter updated' });
      repository.findOneById.mockResolvedValue(existing);
      repository.updateSpaceSkyObject.mockResolvedValue(updated);

      const result = await service.updateSpaceSkyObject(1, {
        name: 'Jupiter updated',
      } as any);

      expect(result).toEqual(updated);
      expect(personalityRepository.findOneById).not.toHaveBeenCalled();
      expect(telescopeRepository.findOneById).not.toHaveBeenCalled();
    });

    it('updates the discoverer when discovererId is provided', async () => {
      const existing = buildSkyObject();
      const discoverer = { id: 7, name: 'Galileo' } as unknown as Personality;
      repository.findOneById.mockResolvedValue(existing);
      personalityRepository.findOneById.mockResolvedValue(discoverer);
      repository.updateSpaceSkyObject.mockResolvedValue(
        buildSkyObject({ discoverer }),
      );

      await service.updateSpaceSkyObject(1, { discovererId: 7 } as any);

      expect(personalityRepository.findOneById).toHaveBeenCalledWith(7);
      expect(repository.updateSpaceSkyObject).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ discoverer }),
      );
    });

    it('throws BadRequestException when the updated discoverer is not found', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      personalityRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.updateSpaceSkyObject(1, { discovererId: 999 } as any),
      ).rejects.toThrow(BadRequestException);
      expect(repository.updateSpaceSkyObject).not.toHaveBeenCalled();
    });

    it('updates the telescope when telescopeId is provided', async () => {
      const existing = buildSkyObject();
      const telescope = { id: 3, name: 'Hubble' } as unknown as Telescope;
      repository.findOneById.mockResolvedValue(existing);
      telescopeRepository.findOneById.mockResolvedValue(telescope);
      repository.updateSpaceSkyObject.mockResolvedValue(
        buildSkyObject({ telescope }),
      );

      await service.updateSpaceSkyObject(1, { telescopeId: 3 } as any);

      expect(telescopeRepository.findOneById).toHaveBeenCalledWith(3);
      expect(repository.updateSpaceSkyObject).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ telescope }),
      );
    });

    it('throws BadRequestException when the updated telescope is not found', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      telescopeRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.updateSpaceSkyObject(1, { telescopeId: 999 } as any),
      ).rejects.toThrow(BadRequestException);
      expect(repository.updateSpaceSkyObject).not.toHaveBeenCalled();
    });

    it('uploads a new image when a file is provided', async () => {
      const existing = buildSkyObject();
      const updated = buildSkyObject({
        objectImage: 'https://cdn/new-jupiter.png',
      });
      repository.findOneById.mockResolvedValue(existing);
      imageUploadService.uploadImage.mockResolvedValue(
        'https://cdn/new-jupiter.png',
      );
      repository.updateSpaceSkyObject.mockResolvedValue(updated);

      const file = buildFile();
      const result = await service.updateSpaceSkyObject(
        1,
        {} as any,
        file,
      );

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'space-sky-objects',
        1,
        { maxSizeMb: 100 },
      );
      expect(repository.updateSpaceSkyObject).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          objectImage: 'https://cdn/new-jupiter.png',
        }),
      );
      expect(result).toEqual(updated);
    });

    it('converts discoveryDate string to a Date when provided', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      repository.updateSpaceSkyObject.mockResolvedValue(buildSkyObject());

      await service.updateSpaceSkyObject(1, {
        discoveryDate: '2020-01-01',
      } as any);

      const [, updatePayload] = repository.updateSpaceSkyObject.mock.calls[0];
      expect((updatePayload as any).discoveryDate).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when the repository update returns null', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      repository.updateSpaceSkyObject.mockResolvedValue(null);

      await expect(
        service.updateSpaceSkyObject(1, {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      repository.updateSpaceSkyObject.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        service.updateSpaceSkyObject(1, {} as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteSpaceSkyObject', () => {
    it('deletes the sky object when it exists', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      repository.deleteSpaceSkyObject.mockResolvedValue(undefined);

      await service.deleteSpaceSkyObject(1);

      expect(repository.deleteSpaceSkyObject).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the sky object does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.deleteSpaceSkyObject(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deleteSpaceSkyObject).not.toHaveBeenCalled();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockResolvedValue(buildSkyObject());
      repository.deleteSpaceSkyObject.mockRejectedValue(
        new Error('db down'),
      );

      await expect(service.deleteSpaceSkyObject(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
