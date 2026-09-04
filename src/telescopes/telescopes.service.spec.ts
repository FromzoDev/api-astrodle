import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TelescopeService } from './telescopes.service';
import { TelescopeRepository } from './telescopes.repository';
import { SpaceOrganisationRepository } from '../spaceOrganisations/space-organisation.repository';
import { AmateurOwnerRepository } from '../amateur-owner/amateur-owner.repository';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { Telescope } from './telescopes.entity';
import { AmateurOwner } from '../amateur-owner/amateur-owner.entity';
import {
  TelescopeLocation,
  TelescopeSpectrum,
} from '../common/enum/telecope.enum';
import { createTelescopeDTO } from './DTO/telescope-create-dto';
import { updateTelescopeDTO } from './DTO/telescope-update-dto';
import { TelescopeQueryDto } from './DTO/telescope-query-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { MulterFile } from '../types/multer-file.type';

describe('TelescopeService', () => {
  let service: TelescopeService;
  let telescopeRepository: jest.Mocked<
    Pick<
      TelescopeRepository,
      | 'findPaginated'
      | 'findOneById'
      | 'findByIds'
      | 'createTelescope'
      | 'updateTelescope'
      | 'deleteTelescope'
    >
  >;
  let spaceOrganisationRepository: jest.Mocked<
    Pick<SpaceOrganisationRepository, 'findByIds'>
  >;
  let amateurOwnerRepository: jest.Mocked<Pick<AmateurOwnerRepository, 'findOneById'>>;
  let imageUploadService: jest.Mocked<Pick<ImageUploadService, 'uploadImage'>>;

  const buildAmateurOwner = (overrides: Partial<AmateurOwner> = {}): AmateurOwner =>
    ({
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      consentToDisplayName: true,
      telescopes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as AmateurOwner;

  const buildTelescope = (overrides: Partial<Telescope> = {}): Telescope =>
    ({
      id: 1,
      name: 'Hubble',
      telescopeImage: undefined,
      telescopeLocation: TelescopeLocation.Space,
      telescopeSpectrum: TelescopeSpectrum.Optical,
      isAmateur: false,
      spaceOrganisations: [],
      amateurOwner: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Telescope;

  beforeEach(async () => {
    telescopeRepository = {
      findPaginated: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      createTelescope: jest.fn(),
      updateTelescope: jest.fn(),
      deleteTelescope: jest.fn(),
    };
    spaceOrganisationRepository = {
      findByIds: jest.fn(),
    };
    amateurOwnerRepository = {
      findOneById: jest.fn(),
    };
    imageUploadService = {
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelescopeService,
        { provide: TelescopeRepository, useValue: telescopeRepository },
        {
          provide: SpaceOrganisationRepository,
          useValue: spaceOrganisationRepository,
        },
        { provide: AmateurOwnerRepository, useValue: amateurOwnerRepository },
        { provide: ImageUploadService, useValue: imageUploadService },
      ],
    }).compile();

    service = module.get<TelescopeService>(TelescopeService);
  });

  describe('findPaginated', () => {
    it('returns the paginated result, masking amateur owner names without consent', async () => {
      const telescope = buildTelescope({
        amateurOwner: buildAmateurOwner({ consentToDisplayName: false }),
      });
      const paginated: PaginationResult<Telescope> = {
        items: [telescope],
        total: 1,
        page: 1,
        limit: 10,
        lastPage: 1,
      };
      telescopeRepository.findPaginated.mockResolvedValue(paginated);

      const result = await service.findPaginated({} as TelescopeQueryDto);

      expect(result.items[0].amateurOwner.firstName).toBeUndefined();
      expect(result.items[0].amateurOwner.lastName).toBeUndefined();
      expect(result.total).toBe(1);
    });

    it('does not mask amateur owner names when consent is given', async () => {
      const telescope = buildTelescope({
        amateurOwner: buildAmateurOwner({ consentToDisplayName: true }),
      });
      telescopeRepository.findPaginated.mockResolvedValue({
        items: [telescope],
        total: 1,
        page: 1,
        limit: 10,
        lastPage: 1,
      });

      const result = await service.findPaginated({} as TelescopeQueryDto);

      expect(result.items[0].amateurOwner.firstName).toBe('Jane');
    });

    it('wraps repository errors in InternalServerErrorException', async () => {
      telescopeRepository.findPaginated.mockRejectedValue(new Error('db down'));

      await expect(
        service.findPaginated({} as TelescopeQueryDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOneById', () => {
    it('returns the telescope when found', async () => {
      const telescope = buildTelescope();
      telescopeRepository.findOneById.mockResolvedValue(telescope);

      const result = await service.findOneById(1);

      expect(result).toEqual(telescope);
      expect(telescopeRepository.findOneById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when not found', async () => {
      telescopeRepository.findOneById.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTelescope', () => {
    const dto: createTelescopeDTO = {
      name: 'Hubble',
      telescopeLocation: TelescopeLocation.Space,
      telescopeSpectrum: TelescopeSpectrum.Optical,
      isAmateur: false,
    };

    it('creates a telescope without a file', async () => {
      const created = buildTelescope();
      telescopeRepository.createTelescope.mockResolvedValue(created);

      const result = await service.createTelescope(dto);

      expect(result).toEqual(created);
      expect(telescopeRepository.createTelescope).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          telescopeLocation: dto.telescopeLocation,
          telescopeSpectrum: dto.telescopeSpectrum,
          isAmateur: false,
        }),
      );
      expect(imageUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when isAmateur and spaceOrganisationIds are both set', async () => {
      await expect(
        service.createTelescope({
          ...dto,
          isAmateur: true,
          spaceOrganisationIds: [1],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(telescopeRepository.createTelescope).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when !isAmateur and amateurOwnerId is set', async () => {
      await expect(
        service.createTelescope({
          ...dto,
          isAmateur: false,
          amateurOwnerId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(telescopeRepository.createTelescope).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the amateur owner is not found', async () => {
      amateurOwnerRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.createTelescope({
          ...dto,
          isAmateur: true,
          amateurOwnerId: 42,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(telescopeRepository.createTelescope).not.toHaveBeenCalled();
    });

    it('uploads the image and updates the telescope when a file is provided', async () => {
      const created = buildTelescope();
      const updated = buildTelescope({ telescopeImage: 'https://cdn/image.png' });
      telescopeRepository.createTelescope.mockResolvedValue(created);
      imageUploadService.uploadImage.mockResolvedValue('https://cdn/image.png');
      telescopeRepository.updateTelescope.mockResolvedValue(updated);

      const file = { originalname: 'img.png', size: 10, mimetype: 'image/png' } as MulterFile;

      const result = await service.createTelescope(dto, file);

      expect(imageUploadService.uploadImage).toHaveBeenCalledWith(
        file,
        'telescopes',
        created.id,
        { maxSizeMb: 100 },
      );
      expect(telescopeRepository.updateTelescope).toHaveBeenCalledWith(
        created.id,
        { telescopeImage: 'https://cdn/image.png' },
      );
      expect(result).toEqual(updated);
    });
  });

  describe('updateTelescope', () => {
    const dto: updateTelescopeDTO = { name: 'New name' };

    it('updates the telescope on the happy path', async () => {
      const existing = buildTelescope();
      const updated = buildTelescope({ name: 'New name' });
      telescopeRepository.findOneById.mockResolvedValue(existing);
      telescopeRepository.updateTelescope.mockResolvedValue(updated);

      const result = await service.updateTelescope(1, dto);

      expect(result).toEqual(updated);
      expect(telescopeRepository.updateTelescope).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'New name' }),
      );
    });

    it('throws NotFoundException when the telescope does not exist', async () => {
      telescopeRepository.findOneById.mockResolvedValue(null);

      await expect(service.updateTelescope(999, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(telescopeRepository.updateTelescope).not.toHaveBeenCalled();
    });
  });

  describe('deleteTelescope', () => {
    it('deletes the telescope on the happy path', async () => {
      telescopeRepository.findOneById.mockResolvedValue(buildTelescope());
      telescopeRepository.deleteTelescope.mockResolvedValue(undefined);

      await service.deleteTelescope(1);

      expect(telescopeRepository.deleteTelescope).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the telescope does not exist', async () => {
      telescopeRepository.findOneById.mockResolvedValue(null);

      await expect(service.deleteTelescope(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(telescopeRepository.deleteTelescope).not.toHaveBeenCalled();
    });
  });
});
