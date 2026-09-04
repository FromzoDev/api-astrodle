import {
  Injectable,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpaceOrganisation } from './space-organisations.entity';
import { createspaceOrganisationDTO } from './DTO/space-organisations-create-dto';
import { updateSpaceOrganisationDTO } from './DTO/space-organisations-update-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { SpaceOrganisationRepository } from './space-organisation.repository';
import { ErrorMessage } from '../common/enum/error.enum';
import { SpaceOrganisationQueryDto } from './DTO/space-organisation-query-dto';
import { ImageUploadService } from '../shared/upload/image-upload.service';
import { MulterFile } from '../types/multer-file.type';

@Injectable()
export class SpaceOrganisationService {
  constructor(
    private readonly spaceOrganisationRepository: SpaceOrganisationRepository,
    private readonly ImageUploadService: ImageUploadService,
  ) {}

  async findPaginated(
    options: SpaceOrganisationQueryDto,
  ): Promise<PaginationResult<SpaceOrganisation>> {
    try {
      return await this.spaceOrganisationRepository.findPaginated(options);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneById(id: number): Promise<SpaceOrganisation | null> {
    try {
      const spaceOrganisation =
        await this.spaceOrganisationRepository.findOneById(id);

      if (!spaceOrganisation) {
        throw new NotFoundException(ErrorMessage.SPACE_ORGANISATION_NOT_FOUND);
      }

      return spaceOrganisation;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async findOneByName(name: string): Promise<SpaceOrganisation | null> {
    try {
      const spaceOrganisation =
        await this.spaceOrganisationRepository.findbyName(name);
      return spaceOrganisation;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
    }
  }

  async createSpaceOrganisation(
    createSpaceOrganisationDTO: createspaceOrganisationDTO,
    file?: MulterFile,
  ): Promise<SpaceOrganisation | null> {
    const saved =
      await this.spaceOrganisationRepository.createSpaceOrganisation(
        createSpaceOrganisationDTO,
      );

    if (file && saved) {
      const logoUrl = await this.ImageUploadService.uploadImage(
        file,
        'space-organisations',
        saved.id,
        {
          maxSizeMb: 100,
        },
      );

      return this.spaceOrganisationRepository.updateSpaceOrganisation(
        saved.id,
        { agencyLogo: logoUrl },
      );
    }

    return saved;
  }

  async updateSpaceOrganisation(
    id: number,
    updateSpaceOrganisationDTO: updateSpaceOrganisationDTO,
    file?: MulterFile,
  ): Promise<SpaceOrganisation> {
    try {
      const spaceOrganisation =
        await this.spaceOrganisationRepository.findOneById(id);

      if (!spaceOrganisation) {
        throw new NotFoundException(ErrorMessage.SPACE_ORGANISATION_NOT_FOUND);
      }

      let logoUrl: string | undefined;

      if (file) {
        logoUrl = await this.ImageUploadService.uploadImage(
          file,
          'space-organisations',
          id,
          {
            maxSizeMb: 100,
          },
        );
      }

      const spaceOrganisationToUpdate = {
        ...updateSpaceOrganisationDTO,
        ...(logoUrl && { agencyLogo: logoUrl }),
      };

      return await this.spaceOrganisationRepository.updateSpaceOrganisation(
        id,
        spaceOrganisationToUpdate,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
    }
  }

  async deleteSpaceOrganisation(id: number): Promise<void> {
    try {
      const spaceOrganisation =
        await this.spaceOrganisationRepository.findOneById(id);

      if (!spaceOrganisation) {
        throw new NotFoundException(ErrorMessage.SPACE_ORGANISATION_NOT_FOUND);
      }

      await this.spaceOrganisationRepository.deleteSpaceOrganisation(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(ErrorMessage.DELETE_ERROR_MESSAGE);
    }
  }
}
