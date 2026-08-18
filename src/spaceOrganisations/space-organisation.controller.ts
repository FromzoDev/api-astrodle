import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, HttpStatus, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SpaceOrganisationService } from './space-organisation.service';
import { createspaceOrganisationDTO } from './DTO/space-organisations-create-dto';
import { updateSpaceOrganisationDTO } from './DTO/space-organisations-update-dto';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/response.interface';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { SpaceOrganisationQueryDto } from './DTO/space-organisation-query-dto';
import { SpaceOrganisation } from './space-organisations.entity';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';
import { ErrorMessage } from '../common/enum/error.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../types/multer-file.type';



@ApiBearerAuth('JWT-auth')
@Controller('space-organisations')
export class SpaceOrganisationController {
    constructor(private readonly spaceOrganisationService: SpaceOrganisationService) { }

    @Get()
    async getSpaceOrganisationsPaginated( @Query() queryDto: SpaceOrganisationQueryDto ): Promise<PaginatedApiResponse<SpaceOrganisation>> {

        const result = await this.spaceOrganisationService.findPaginated(
            queryDto,
        );

        return {
            code: HttpStatus.OK,
            message: result.items.length > 0 ? SuccessMessage.SPACE_ORGANISATION_FETCHED_ALL : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
            data: result.items,
            pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            lastPage: result.lastPage,
            },
        };
    }

    @Get('/:id')
    async getSpaceOrganisationById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<SpaceOrganisation | null>> {
        return await this.spaceOrganisationService.findOneById(id).then(spaceOrganisation => ({
            code: HttpStatus.OK,
            message: SuccessMessage.SPACE_ORGANISATION_FETCHED_BY_ID,
            data: spaceOrganisation,
        }));
    }

    @Auth(Role.Moderator)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
    schema: {
        type: 'object',
        properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        country: { type: 'string' },
        file: { type: 'string', format: 'binary' },
        },
    },
    })
    @Post()
    @ApiConsumes('multipart/form-data')
    async createSpaceOrganisation(@Body() createSpaceOrganisationDTO: createspaceOrganisationDTO, @UploadedFile() file?: MulterFile): Promise<ApiResponse<SpaceOrganisation>> {
        return await this.spaceOrganisationService.createSpaceOrganisation(createSpaceOrganisationDTO, file).then(spaceOrganisation => ({
            code: HttpStatus.CREATED,
            message: SuccessMessage.SPACE_ORGANISATION_CREATED,
            data: spaceOrganisation,
        }));
    }

    @Auth(Role.Moderator)
    @Put('/:id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
    schema: {
        type: 'object',
        properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        country: { type: 'string' },
        file: { type: 'string', format: 'binary' },
        },
    },
    })
    
    async updateSpaceOrganisation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpaceOrganisationDTO: updateSpaceOrganisationDTO,
    @UploadedFile() file: MulterFile,
    ): Promise<ApiResponse<SpaceOrganisation | null>> {
    return await this.spaceOrganisationService
        .updateSpaceOrganisation(id, updateSpaceOrganisationDTO, file)
        .then(spaceOrganisation => ({
        code: HttpStatus.OK,
        message: SuccessMessage.SPACE_ORGANISATION_UPDATED,
        data: spaceOrganisation,
        }));
    }

    @Auth(Role.Moderator)
    @Delete('/:id')
    async deleteSpaceOrganisation(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<void>> {
        return await this.spaceOrganisationService.deleteSpaceOrganisation(id).then(success => ({
            code: HttpStatus.OK,
            message: SuccessMessage.SPACE_ORGANISATION_DELETED,
            data: success,
        }));
    }
    
}