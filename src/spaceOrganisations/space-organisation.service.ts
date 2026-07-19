import {Controller, Get, Request, Param, Post, Body, Patch, ParseIntPipe, Delete, HttpStatus, Query, Injectable, HttpException, InternalServerErrorException, NotFoundException, ConflictException} from '@nestjs/common';
import { SpaceOrganisation } from './space-organisations.entity';
import { SuccessMessage } from '../common/enum/success.enum';
import { createspaceOrganisationDTO } from './DTO/space-organisations-create-user-dto';
import { updateSpaceOrganisationDTO } from './DTO/space-organisations-update-user-dto';
import { ApiResponse } from '../common/interfaces/response.interface';
import { PaginationDto } from '../shared/pagination/pagination-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { Role } from '../common/enum/roles.enum';
import { SpaceOrganisationRepository } from './space-organisation.repository';
import { ErrorMessage } from '../common/enum/error.enum';


@Injectable()
export class SpaceOrganisationService   {
    constructor(private readonly spaceOrganisationRepository: SpaceOrganisationRepository)  { }

    async findPaginated(options: PaginationDto) : Promise<PaginationResult<SpaceOrganisation>> {
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
            const spaceOrganisation = await this.spaceOrganisationRepository.findOneById(id);

            if (!spaceOrganisation) {
                throw new NotFoundException(ErrorMessage.SPACE_ORGANISATION_NOT_FOUND);
            }

            return spaceOrganisation

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
        }
    }

    async findOneByName(name: string): Promise<SpaceOrganisation | null> {
        try {
            const spaceOrganisation = await this.spaceOrganisationRepository.findbyName(name);
            return spaceOrganisation;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
        }
    }

    async createSpaceOrganisation(createSpaceOrganisationDTO: createspaceOrganisationDTO) : Promise<SpaceOrganisation> {
        try {
            const spaceOrganisationExisting = await this.spaceOrganisationRepository.findbyName(createSpaceOrganisationDTO.name);

            if (spaceOrganisationExisting) {
                throw new ConflictException(ErrorMessage.SPACE_ORGANISATION_ALREADY_EXISTS);
            }

            const spaceOrganisationToSave = {...createSpaceOrganisationDTO, createdAt: new Date(), updatedAt: new Date()};

            return await this.spaceOrganisationRepository.createSpaceOrganisation(spaceOrganisationToSave);
            
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException) {

                console.error(error);
                throw error;
            }

            throw new InternalServerErrorException(ErrorMessage.GLOBAL_ERROR_MESSAGE);
        }
    }

    async updateSpaceOrganisation(id: number, updateSpaceOrganisationDTO: updateSpaceOrganisationDTO) : Promise<SpaceOrganisation> {
        try {
            const spaceOrganisation = await this.spaceOrganisationRepository.findOneById(id);
            
            if (!spaceOrganisation) {
                throw new NotFoundException(ErrorMessage.SPACE_ORGANISATION_NOT_FOUND);
            }

            const spaceOrganisationToUpdate = {...spaceOrganisation, ...updateSpaceOrganisationDTO, updatedAt: new Date()};
            
            return await this.spaceOrganisationRepository.updateSpaceOrganisation(id, spaceOrganisationToUpdate);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(ErrorMessage.UPDATE_ERROR_MESSAGE);
        }
    }

    async deleteSpaceOrganisation(id: number): Promise<void> {
        try {
            const spaceOrganisation = await this.spaceOrganisationRepository.findOneById(id);
            
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