import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpaceOrganisationService } from './space-organisation.service';
import { SpaceOrganisationRepository } from './space-organisation.repository';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { SpaceOrganisation } from './space-organisations.entity';
import { Country } from '../common/enum/country.enum';
import { MulterFile } from '../types/multer-file.type';
import { PaginationResult } from '../shared/pagination/pagination.interface';

describe('SpaceOrganisationService', () => {
  let service: SpaceOrganisationService;
  let repository: jest.Mocked<SpaceOrganisationRepository>;
  let imageUploadService: jest.Mocked<ImageUploadService>;

  const buildOrganisation = (
    overrides: Partial<SpaceOrganisation> = {},
  ): SpaceOrganisation =>
    ({
      id: 1,
      name: 'NASA',
      description: 'Agence spatiale américaine',
      countries: [Country.UnitedStates],
      agencyLogo: undefined,
      telescopes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as SpaceOrganisation;

  const buildFile = (overrides: Partial<MulterFile> = {}): MulterFile =>
    ({
      fieldname: 'logo',
      originalname: 'logo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('fake'),
      ...overrides,
    }) as MulterFile;

  beforeEach(async () => {
    const repositoryMock: Partial<
      jest.Mocked<SpaceOrganisationRepository>
    > = {
      findPaginated: jest.fn(),
      findOneById: jest.fn(),
      findbyName: jest.fn(),
      createSpaceOrganisation: jest.fn(),
      updateSpaceOrganisation: jest.fn(),
      deleteSpaceOrganisation: jest.fn(),
    };

    const imageUploadServiceMock: Partial<jest.Mocked<ImageUploadService>> = {
      uploadImage: jest.fn(),
      deleteImageByUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceOrganisationService,
        {
          provide: SpaceOrganisationRepository,
          useValue: repositoryMock,
        },
        {
          provide: ImageUploadService,
          useValue: imageUploadServiceMock,
        },
      ],
    }).compile();

    service = module.get<SpaceOrganisationService>(SpaceOrganisationService);
    repository = module.get(SpaceOrganisationRepository);
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
      const result: PaginationResult<SpaceOrganisation> = {
        items: [buildOrganisation()],
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
    it('returns the space organisation when found', async () => {
      const organisation = buildOrganisation();
      repository.findOneById.mockResolvedValue(organisation);

      const result = await service.findOneById(1);

      expect(result).toEqual(organisation);
      expect(repository.findOneById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the organisation does not exist', async () => {
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

  describe('findOneByName', () => {
    it('returns the space organisation when found', async () => {
      const organisation = buildOrganisation();
      repository.findbyName.mockResolvedValue(organisation);

      const result = await service.findOneByName('NASA');

      expect(result).toEqual(organisation);
      expect(repository.findbyName).toHaveBeenCalledWith('NASA');
    });

    it('returns null without throwing when not found', async () => {
      repository.findbyName.mockResolvedValue(null);

      const result = await service.findOneByName('Unknown');

      expect(result).toBeNull();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findbyName.mockRejectedValue(new Error('db down'));

      await expect(service.findOneByName('NASA')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createSpaceOrganisation', () => {
    it('creates the organisation without a file', async () => {
      const created = buildOrganisation();
      repository.createSpaceOrganisation.mockResolvedValue(created);

      const dto = {
        name: 'NASA',
        description: 'desc',
        countries: [Country.UnitedStates],
      };
      const result = await service.createSpaceOrganisation(dto as any);

      expect(result).toEqual(created);
      expect(repository.createSpaceOrganisation).toHaveBeenCalledWith(dto);
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
      expect(repository.updateSpaceOrganisation).not.toHaveBeenCalled();
    });

    it('uploads the logo and updates the organisation when a file is provided', async () => {
      const created = buildOrganisation({ id: 5 });
      const updated = buildOrganisation({
        id: 5,
        agencyLogo: 'https://cdn/logo.png',
      });
      repository.createSpaceOrganisation.mockResolvedValue(created);
      imageUploadService.uploadImage.mockResolvedValue(
        'https://cdn/logo.png',
      );
      repository.updateSpaceOrganisation.mockResolvedValue(updated);

      const dto = {
        name: 'NASA',
        description: 'desc',
        countries: [Country.UnitedStates],
      };
      const file = buildFile();
      const result = await service.createSpaceOrganisation(
        dto as any,
        file,
      );

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'space-organisations',
        5,
        { maxSizeMb: 100 },
      );
      expect(repository.updateSpaceOrganisation).toHaveBeenCalledWith(5, {
        agencyLogo: 'https://cdn/logo.png',
      });
      expect(result).toEqual(updated);
    });

    it('does not upload a file when creation returns no saved entity', async () => {
      repository.createSpaceOrganisation.mockResolvedValue(null);

      const dto = {
        name: 'NASA',
        description: 'desc',
        countries: [Country.UnitedStates],
      };
      const result = await service.createSpaceOrganisation(
        dto as any,
        buildFile(),
      );

      expect(result).toBeNull();
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('propagates repository errors unchanged (no try/catch wrapping)', async () => {
      repository.createSpaceOrganisation.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        service.createSpaceOrganisation({} as any),
      ).rejects.toThrow('db down');
    });
  });

  describe('updateSpaceOrganisation', () => {
    it('updates the organisation without a file', async () => {
      const existing = buildOrganisation();
      const updated = buildOrganisation({ name: 'NASA updated' });
      repository.findOneById.mockResolvedValue(existing);
      repository.updateSpaceOrganisation.mockResolvedValue(updated);

      const dto = { name: 'NASA updated' };
      const result = await service.updateSpaceOrganisation(1, dto as any);

      expect(result).toEqual(updated);
      expect(repository.updateSpaceOrganisation).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('uploads a new logo when a file is provided', async () => {
      const existing = buildOrganisation();
      const updated = buildOrganisation({
        agencyLogo: 'https://cdn/new-logo.png',
      });
      repository.findOneById.mockResolvedValue(existing);
      imageUploadService.uploadImage.mockResolvedValue(
        'https://cdn/new-logo.png',
      );
      repository.updateSpaceOrganisation.mockResolvedValue(updated);

      const file = buildFile();
      const result = await service.updateSpaceOrganisation(
        1,
        {} as any,
        file,
      );

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'space-organisations',
        1,
        { maxSizeMb: 100 },
      );
      expect(repository.updateSpaceOrganisation).toHaveBeenCalledWith(1, {
        agencyLogo: 'https://cdn/new-logo.png',
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when the organisation does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(
        service.updateSpaceOrganisation(999, {} as any),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateSpaceOrganisation).not.toHaveBeenCalled();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockResolvedValue(buildOrganisation());
      repository.updateSpaceOrganisation.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        service.updateSpaceOrganisation(1, {} as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteSpaceOrganisation', () => {
    it('deletes the organisation when it exists', async () => {
      repository.findOneById.mockResolvedValue(buildOrganisation());
      repository.deleteSpaceOrganisation.mockResolvedValue(undefined);

      await service.deleteSpaceOrganisation(1);

      expect(repository.deleteSpaceOrganisation).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the organisation does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.deleteSpaceOrganisation(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deleteSpaceOrganisation).not.toHaveBeenCalled();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockResolvedValue(buildOrganisation());
      repository.deleteSpaceOrganisation.mockRejectedValue(
        new Error('db down'),
      );

      await expect(service.deleteSpaceOrganisation(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
