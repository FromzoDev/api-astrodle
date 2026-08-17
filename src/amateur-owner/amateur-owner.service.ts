import { Injectable, HttpException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AmateurOwner } from './amateur-owner.entity';
import { createAmateurOwnerDTO } from './DTO/create-amateur-owner-dto';
import { updateAmateurOwnerDTO } from './DTO/update-amateur-owner-dto';
import { AmateurOwnerQueryDto } from './DTO/amateur-owner-query-dto';
import { AmateurOwnerRepository } from './amateur-owner.repository';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { ErrorMessage } from '../common/enum/error.enum';

@Injectable()
export class AmateurOwnerService {
  constructor(private readonly amateurOwnerRepository: AmateurOwnerRepository) {}

  async findPaginated(options: AmateurOwnerQueryDto): Promise<PaginationResult<AmateurOwner>> {
    try {
      return await this.amateurOwnerRepository.findPaginated(options);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneById(id: number): Promise<AmateurOwner | null> {
    try {
      const amateurOwner = await this.amateurOwnerRepository.findOneById(id);

      if (!amateurOwner) {
        throw new NotFoundException(ErrorMessage.AMATEUR_OWNER_NOT_FOUND);
      }

      return amateurOwner;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async createAmateurOwner(dto: createAmateurOwnerDTO): Promise<AmateurOwner> {
    try {
      if (dto.consentToDisplayName && (!dto.firstName || !dto.lastName)) {
        throw new BadRequestException(
          "Le nom et prénom sont requis si le consentement à l'affichage est donné",
        );
      }

      return await this.amateurOwnerRepository.createAmateurOwner(dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async updateAmateurOwner(id: number, dto: updateAmateurOwnerDTO): Promise<AmateurOwner> {
    try {
      const amateurOwner = await this.amateurOwnerRepository.findOneById(id);

      if (!amateurOwner) {
        throw new NotFoundException(ErrorMessage.AMATEUR_OWNER_NOT_FOUND);
      }

      const finalFirstName = dto.firstName ?? amateurOwner.firstName;
      const finalLastName = dto.lastName ?? amateurOwner.lastName;
      const finalConsent = dto.consentToDisplayName ?? amateurOwner.consentToDisplayName;

      if (finalConsent && (!finalFirstName || !finalLastName)) {
        throw new BadRequestException(
          "Le nom et prénom sont requis si le consentement à l'affichage est donné",
        );
      }

      const updated = await this.amateurOwnerRepository.updateAmateurOwner(id, dto);

      if (!updated) {
        throw new NotFoundException(ErrorMessage.AMATEUR_OWNER_NOT_FOUND);
      }

      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deleteAmateurOwner(id: number): Promise<void> {
    try {
      const amateurOwner = await this.amateurOwnerRepository.findOneById(id);

      if (!amateurOwner) {
        throw new NotFoundException(ErrorMessage.AMATEUR_OWNER_NOT_FOUND);
      }

      await this.amateurOwnerRepository.deleteAmateurOwner(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorMessage.DELETE_ERROR_MESSAGE);
    }
  }
}