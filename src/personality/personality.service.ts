import { Injectable, HttpException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Personality } from './personality.entity';
import { createPersonalityDTO } from './DTO/create-personality-dto';
import { updatePersonalityDTO } from './DTO/update-personality-dto';
import { PersonalityQueryDto } from './DTO/personality-query-dto';
import { PersonalityRepository } from './personality.repository';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { MulterFile } from '../types/multer-file.type';
import { ErrorMessage } from '../common/enum/error.enum';

@Injectable()
export class PersonalityService {
  constructor(
    private readonly personalityRepository: PersonalityRepository,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  async findPaginated(options: PersonalityQueryDto): Promise<PaginationResult<Personality>> {
    try {
      return await this.personalityRepository.findPaginated(options);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneById(id: number): Promise<Personality | null> {
    try {
      const personality = await this.personalityRepository.findOneById(id);

      if (!personality) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      return personality;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async createPersonality(dto: createPersonalityDTO, file?: MulterFile): Promise<Personality> {
    try {
        const saved = await this.personalityRepository.createPersonality({
            ...dto,
            dateOfBirth: new Date(dto.dateOfBirth),
            dateOfDeath: dto.dateOfDeath ? new Date(dto.dateOfDeath) : undefined,
        });

      if (file) {
        const personalityImage = await this.imageUploadService.uploadImage(file, 'personalities', saved.id, {
          maxSizeMb: 100,
        });
        return this.personalityRepository.updatePersonality(saved.id, { personalityImage });
      }

      return saved;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async updatePersonality(id: number, dto: updatePersonalityDTO, file?: MulterFile): Promise<Personality> {
    try {
      const personality = await this.personalityRepository.findOneById(id);

      if (!personality) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      let personalityImage: string | undefined;
      if (file) {
        personalityImage = await this.imageUploadService.uploadImage(file, 'personalities', id, {
          maxSizeMb: 100,
        });
      }

      const updated = await this.personalityRepository.updatePersonality(id, {
        ...dto,
        ...dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) },
        ...dto.dateOfDeath && { dateOfDeath: new Date(dto.dateOfDeath) },
        ...(personalityImage && { personalityImage }),
      });

      if (!updated) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deletePersonality(id: number): Promise<void> {
    try {
      const personality = await this.personalityRepository.findOneById(id);

      if (!personality) {
        throw new NotFoundException(ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE);
      }

      await this.personalityRepository.deletePersonality(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.DELETE_ERROR_MESSAGE);
    }
  }
}