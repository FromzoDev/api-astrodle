import { Injectable, HttpException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Telescope } from './telescopes.entity';
import { createTelescopeDTO } from './DTO/telescope-create-dto';
import { updateTelescopeDTO } from './DTO/telescope-update-dto';
import { TelescopeQueryDto } from './DTO/telescope-query-dto';
import { TelescopeRepository } from './telescopes.repository';
import { SpaceOrganisationRepository } from '../spaceOrganisations/space-organisation.repository';
import { AmateurOwnerRepository } from '../amateur-owner/amateur-owner.repository';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { ErrorMessage } from '../common/enum/error.enum';

@Injectable()
export class TelescopeService {
  constructor(
    private readonly telescopeRepository: TelescopeRepository,
    private readonly spaceOrganisationRepository: SpaceOrganisationRepository,
    private readonly amateurOwnerRepository: AmateurOwnerRepository,
  ) {}

  async findPaginated(options: TelescopeQueryDto): Promise<PaginationResult<Telescope>> {
    try {
      const result = await this.telescopeRepository.findPaginated(options);
      result.items = result.items.map((telescope) => this.maskAmateurOwnerIfNeeded(telescope));
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneById(id: number): Promise<Telescope | null> {
    try {
      const telescope = await this.telescopeRepository.findOneById(id);

      if (!telescope) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      return this.maskAmateurOwnerIfNeeded(telescope);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async createTelescope(dto: createTelescopeDTO): Promise<Telescope> {
    try {
      this.validateAmateurConsistency(dto.isAmateur, dto.spaceOrganisationIds, dto.amateurOwnerId);

      const spaceOrganisations = dto.spaceOrganisationIds?.length
        ? await this.spaceOrganisationRepository.findByIds(dto.spaceOrganisationIds)
        : [];

      let amateurOwner = undefined;
      if (dto.amateurOwnerId) {
        amateurOwner = await this.amateurOwnerRepository.findOneById(dto.amateurOwnerId);
        if (!amateurOwner) {
          throw new BadRequestException(ErrorMessage.AMATEUR_OWNER_NOT_FOUND);
        }
      }

      const telescope = await this.telescopeRepository.createTelescope({
        name: dto.name,
        telescopeLocation: dto.telescopeLocation,
        telescopeSpectrum: dto.telescopeSpectrum,
        isAmateur: dto.isAmateur ?? false,
        spaceOrganisations,
        amateurOwner,
      });

      return this.maskAmateurOwnerIfNeeded(telescope);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async updateTelescope(id: number, dto: updateTelescopeDTO): Promise<Telescope> {
    try {
      const telescope = await this.telescopeRepository.findOneById(id);

      if (!telescope) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      const finalIsAmateur = dto.isAmateur ?? telescope.isAmateur;
      this.validateAmateurConsistency(finalIsAmateur, dto.spaceOrganisationIds, dto.amateurOwnerId);

      let spaceOrganisations = telescope.spaceOrganisations;
      if (dto.spaceOrganisationIds !== undefined) {
        spaceOrganisations = dto.spaceOrganisationIds.length
          ? await this.spaceOrganisationRepository.findByIds(dto.spaceOrganisationIds)
          : [];
      }

      let amateurOwner = telescope.amateurOwner;
      if (dto.amateurOwnerId !== undefined) {
        amateurOwner = await this.amateurOwnerRepository.findOneById(dto.amateurOwnerId);
        if (!amateurOwner) {
          throw new BadRequestException(ErrorMessage.AMATEUR_OWNER_NOT_FOUND);
        }
      }

      const updated = await this.telescopeRepository.updateTelescope(id, {
        ...dto,
        spaceOrganisations,
        amateurOwner,
      });

      if (!updated) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      return this.maskAmateurOwnerIfNeeded(updated);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deleteTelescope(id: number): Promise<void> {
    try {
      const telescope = await this.telescopeRepository.findOneById(id);

      if (!telescope) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      await this.telescopeRepository.deleteTelescope(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.DELETE_ERROR_MESSAGE);
    }
  }

  private validateAmateurConsistency(
    isAmateur: boolean | undefined,
    spaceOrganisationIds: number[] | undefined,
    amateurOwnerId: number | undefined,
  ): void {
    if (isAmateur && spaceOrganisationIds?.length) {
      throw new BadRequestException("Un télescope amateur ne peut pas être lié à une organisation spatiale");
    }

    if (!isAmateur && amateurOwnerId) {
      throw new BadRequestException("Un télescope professionnel ne peut pas avoir de propriétaire amateur");
    }
  }

  private maskAmateurOwnerIfNeeded(telescope: Telescope): Telescope {
    if (telescope.amateurOwner && !telescope.amateurOwner.consentToDisplayName) {
      telescope.amateurOwner = {
        ...telescope.amateurOwner,
        firstName: undefined,
        lastName: undefined,
      };
    }
    return telescope;
  }
}