import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, HttpStatus, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { TelescopeService } from './telescopes.service';
import { createTelescopeDTO } from './DTO/telescope-create-dto';
import { updateTelescopeDTO } from './DTO/telescope-update-dto';
import { TelescopeQueryDto } from './DTO/telescope-query-dto';
import { Telescope } from './telescopes.entity';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/response.interface';
import { SuccessMessage } from '../common/enum/success.enum';
import { ErrorMessage } from '../common/enum/error.enum';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../types/multer-file.type';

@ApiBearerAuth('JWT-auth')
@Controller('telescopes')
export class TelescopeController {
  constructor(private readonly telescopeService: TelescopeService) {}

  @Get()
  async getTelescopesPaginated(
    @Query() queryDto: TelescopeQueryDto,
  ): Promise<PaginatedApiResponse<Telescope>> {
    const result = await this.telescopeService.findPaginated(queryDto);

    return {
      code: HttpStatus.OK,
      message: result.items.length > 0 ? SuccessMessage.TELESCOPE_FETCHED_ALL : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
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
  async getTelescopeById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<Telescope | null>> {
    return await this.telescopeService.findOneById(id).then((telescope) => ({
      code: HttpStatus.OK,
      message: SuccessMessage.TELESCOPE_FETCHED_BY_ID,
      data: telescope,
    }));
  }

  @Auth(Role.Moderator)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        telescopeLocation: { type: 'string' },
        telescopeSpectrum: { type: 'string' },
        isAmateur: { type: 'boolean' },
        spaceOrganisationIds: { type: 'array', items: { type: 'number' } },
        amateurOwnerId: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async createTelescope(
    @Body() dto: createTelescopeDTO,
    @UploadedFile() file?: MulterFile,
  ): Promise<ApiResponse<Telescope>> {
    return await this.telescopeService.createTelescope(dto).then((telescope) => ({
      code: HttpStatus.CREATED,
      message: SuccessMessage.TELESCOPE_CREATED,
      data: telescope,
    }));
  }

  @Auth(Role.Moderator)
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        telescopeLocation: { type: 'string' },
        telescopeSpectrum: { type: 'string' },
        isAmateur: { type: 'boolean' },
        spaceOrganisationIds: { type: 'array', items: { type: 'number' } },
        amateurOwnerId: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateTelescope(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: updateTelescopeDTO,
    @UploadedFile() file?: MulterFile,
  ): Promise<ApiResponse<Telescope>> {
    return await this.telescopeService.updateTelescope(id, dto).then((telescope) => ({
      code: HttpStatus.OK,
      message: SuccessMessage.TELESCOPE_UPDATED,
      data: telescope,
    }));
  }

  @Auth(Role.Moderator)
  @Delete('/:id')
  async deleteTelescope(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.telescopeService.deleteTelescope(id);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.TELESCOPE_DELETED,
      data: null,
    };
  }
}