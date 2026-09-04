import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AmateurOwnerService } from './amateur-owner.service';
import { AmateurOwnerRepository } from './amateur-owner.repository';
import { AmateurOwner } from './amateur-owner.entity';
import { createAmateurOwnerDTO } from './DTO/create-amateur-owner-dto';
import { updateAmateurOwnerDTO } from './DTO/update-amateur-owner-dto';
import { AmateurOwnerQueryDto } from './DTO/amateur-owner-query-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';

describe('AmateurOwnerService', () => {
  let service: AmateurOwnerService;
  let repository: jest.Mocked<AmateurOwnerRepository>;

  const buildAmateurOwner = (
    overrides: Partial<AmateurOwner> = {},
  ): AmateurOwner => ({
    id: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    consentToDisplayName: true,
    telescopes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const repositoryMock = {
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      findOneById: jest.fn(),
      createAmateurOwner: jest.fn(),
      updateAmateurOwner: jest.fn(),
      deleteAmateurOwner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmateurOwnerService,
        { provide: AmateurOwnerRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<AmateurOwnerService>(AmateurOwnerService);
    repository = module.get(AmateurOwnerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPaginated', () => {
    it('returns the paginated result from the repository', async () => {
      const options: AmateurOwnerQueryDto = { page: 1, limit: 20 };
      const paginated: PaginationResult<AmateurOwner> = {
        items: [buildAmateurOwner()],
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
      const options: AmateurOwnerQueryDto = { page: 1, limit: 20 };
      repository.findPaginated.mockRejectedValue(new Error('db down'));

      await expect(service.findPaginated(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneById', () => {
    it('returns the amateur owner when found', async () => {
      const amateurOwner = buildAmateurOwner();
      repository.findOneById.mockResolvedValue(amateurOwner);

      const result = await service.findOneById(1);

      expect(result).toEqual(amateurOwner);
      expect(repository.findOneById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the amateur owner does not exist', async () => {
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

  describe('createAmateurOwner', () => {
    it('creates the amateur owner when consent and names are consistent', async () => {
      const dto: createAmateurOwnerDTO = {
        firstName: 'Jean',
        lastName: 'Dupont',
        consentToDisplayName: true,
      };
      const created = buildAmateurOwner();
      repository.createAmateurOwner.mockResolvedValue(created);

      const result = await service.createAmateurOwner(dto);

      expect(result).toEqual(created);
      expect(repository.createAmateurOwner).toHaveBeenCalledWith(dto);
    });

    it('creates the amateur owner when consent is not given, even without a name', async () => {
      const dto: createAmateurOwnerDTO = {
        consentToDisplayName: false,
      };
      const created = buildAmateurOwner({
        firstName: undefined,
        lastName: undefined,
        consentToDisplayName: false,
      });
      repository.createAmateurOwner.mockResolvedValue(created);

      const result = await service.createAmateurOwner(dto);

      expect(result).toEqual(created);
    });

    it('throws BadRequestException when consent is given without a first name', async () => {
      const dto: createAmateurOwnerDTO = {
        lastName: 'Dupont',
        consentToDisplayName: true,
      };

      await expect(service.createAmateurOwner(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.createAmateurOwner).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when consent is given without a last name', async () => {
      const dto: createAmateurOwnerDTO = {
        firstName: 'Jean',
        consentToDisplayName: true,
      };

      await expect(service.createAmateurOwner(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.createAmateurOwner).not.toHaveBeenCalled();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      const dto: createAmateurOwnerDTO = {
        firstName: 'Jean',
        lastName: 'Dupont',
        consentToDisplayName: true,
      };
      repository.createAmateurOwner.mockRejectedValue(new Error('db down'));

      await expect(service.createAmateurOwner(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateAmateurOwner', () => {
    it('updates the amateur owner when found and data is consistent', async () => {
      const existing = buildAmateurOwner();
      const dto: updateAmateurOwnerDTO = { firstName: 'Paul' };
      const updated = buildAmateurOwner({ firstName: 'Paul' });
      repository.findOneById.mockResolvedValue(existing);
      repository.updateAmateurOwner.mockResolvedValue(updated);

      const result = await service.updateAmateurOwner(1, dto);

      expect(result).toEqual(updated);
      expect(repository.updateAmateurOwner).toHaveBeenCalledWith(1, dto);
    });

    it('throws NotFoundException when the amateur owner does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(
        service.updateAmateurOwner(999, { firstName: 'Paul' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateAmateurOwner).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the merged result requires consent but has no name', async () => {
      const existing = buildAmateurOwner({
        firstName: 'Jean',
        lastName: 'Dupont',
        consentToDisplayName: false,
      });
      repository.findOneById.mockResolvedValue(existing);

      await expect(
        service.updateAmateurOwner(1, {
          consentToDisplayName: true,
          firstName: '',
        } as unknown as updateAmateurOwnerDTO),
      ).rejects.toThrow(BadRequestException);
      expect(repository.updateAmateurOwner).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the update returns null', async () => {
      const existing = buildAmateurOwner();
      repository.findOneById.mockResolvedValue(existing);
      repository.updateAmateurOwner.mockResolvedValue(null);

      await expect(
        service.updateAmateurOwner(1, { firstName: 'Paul' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      repository.findOneById.mockRejectedValue(new Error('db down'));

      await expect(
        service.updateAmateurOwner(1, { firstName: 'Paul' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteAmateurOwner', () => {
    it('deletes the amateur owner when found', async () => {
      const existing = buildAmateurOwner();
      repository.findOneById.mockResolvedValue(existing);
      repository.deleteAmateurOwner.mockResolvedValue(undefined);

      await service.deleteAmateurOwner(1);

      expect(repository.deleteAmateurOwner).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when the amateur owner does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);

      await expect(service.deleteAmateurOwner(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deleteAmateurOwner).not.toHaveBeenCalled();
    });

    it('wraps unexpected repository errors in InternalServerErrorException', async () => {
      const existing = buildAmateurOwner();
      repository.findOneById.mockResolvedValue(existing);
      repository.deleteAmateurOwner.mockRejectedValue(new Error('db down'));

      await expect(service.deleteAmateurOwner(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
