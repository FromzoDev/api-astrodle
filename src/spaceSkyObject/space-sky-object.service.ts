import {
  Injectable,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SpaceSkyObject } from './space-sky-object.entity';
import { createSpaceSkyObjectDTO } from './DTO/create-space-sky-object-dto';
import { updateSpaceSkyObjectDTO } from './DTO/update-space-sky-object-dto';
import { SpaceSkyObjectQueryDto } from './DTO/space-sky-object-query-dto';
import { SpaceSkyObjectRepository } from './space-sky-object.repository';
import { PersonalityRepository } from '../personality/personality.repository';
import { Personality } from '../personality/personality.entity';
import { TelescopeRepository } from '../telescopes/telescopes.repository';
import { Telescope } from '../telescopes/telescopes.entity';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { MulterFile } from '../types/multer-file.type';
import { ErrorMessage } from '../common/enum/error.enum';

@Injectable()
export class SpaceSkyObjectService {
  constructor(
    private readonly spaceSkyObjectRepository: SpaceSkyObjectRepository,
    private readonly personalityRepository: PersonalityRepository,
    private readonly telescopeRepository: TelescopeRepository,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  async findPaginated(
    options: SpaceSkyObjectQueryDto,
  ): Promise<PaginationResult<SpaceSkyObject>> {
    try {
      return await this.spaceSkyObjectRepository.findPaginated(options);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneById(id: number): Promise<SpaceSkyObject | null> {
    try {
      const spaceSkyObject =
        await this.spaceSkyObjectRepository.findOneById(id);
      if (!spaceSkyObject) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }
      return spaceSkyObject;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async createSpaceSkyObject(
    dto: createSpaceSkyObjectDTO,
    file?: MulterFile,
  ): Promise<SpaceSkyObject> {
    try {
      let discoverer: Personality | undefined = undefined;
      if (dto.discovererId) {
        discoverer =
          (await this.personalityRepository.findOneById(dto.discovererId)) ??
          undefined;
        if (!discoverer) {
          throw new BadRequestException('Découvreur introuvable');
        }
      }

      let telescope: Telescope | undefined = undefined;
      if (dto.telescopeId) {
        telescope =
          (await this.telescopeRepository.findOneById(dto.telescopeId)) ??
          undefined;
        if (!telescope) {
          throw new BadRequestException('Télescope introuvable');
        }
      }

      const saved = await this.spaceSkyObjectRepository.createSpaceSkyObject({
        name: dto.name,
        constellationName: dto.constellationName,
        discoveryDate: new Date(dto.discoveryDate),
        objectType: dto.objectType,
        magnitude: dto.magnitude,
        distanceLightYears: dto.distanceLightYears,
        description: dto.description,
        discoverer,
        telescope,
      });

      if (file) {
        const objectImage = await this.imageUploadService.uploadImage(
          file,
          'space-sky-objects',
          saved.id,
          {
            maxSizeMb: 100,
          },
        );
        return this.spaceSkyObjectRepository.updateSpaceSkyObject(saved.id, {
          objectImage,
        });
      }

      return saved;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async updateSpaceSkyObject(
    id: number,
    dto: updateSpaceSkyObjectDTO,
    file?: MulterFile,
  ): Promise<SpaceSkyObject> {
    try {
      const spaceSkyObject =
        await this.spaceSkyObjectRepository.findOneById(id);
      if (!spaceSkyObject) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      let discoverer = spaceSkyObject.discoverer;
      if (dto.discovererId !== undefined) {
        discoverer = await this.personalityRepository.findOneById(
          dto.discovererId,
        );
        if (!discoverer) {
          throw new BadRequestException('Découvreur introuvable');
        }
      }

      let telescope = spaceSkyObject.telescope;
      if (dto.telescopeId !== undefined) {
        telescope = await this.telescopeRepository.findOneById(dto.telescopeId);
        if (!telescope) {
          throw new BadRequestException('Télescope introuvable');
        }
      }

      let objectImage: string | undefined;
      if (file) {
        objectImage = await this.imageUploadService.uploadImage(
          file,
          'space-sky-objects',
          id,
          {
            maxSizeMb: 100,
          },
        );
      }

      const updated = await this.spaceSkyObjectRepository.updateSpaceSkyObject(
        id,
        {
          ...dto,
          ...(dto.discoveryDate && {
            discoveryDate: new Date(dto.discoveryDate),
          }),
          discoverer,
          telescope,
          ...(objectImage && { objectImage }),
        },
      );

      if (!updated) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      return updated;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deleteSpaceSkyObject(id: number): Promise<void> {
    try {
      const spaceSkyObject =
        await this.spaceSkyObjectRepository.findOneById(id);
      if (!spaceSkyObject) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }
      await this.spaceSkyObjectRepository.deleteSpaceSkyObject(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(ErrorMessage.DELETE_ERROR_MESSAGE);
    }
  }
}
