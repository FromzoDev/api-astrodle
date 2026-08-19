import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, HttpStatus, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SpaceSkyObjectService } from './space-sky-object.service';
import { createSpaceSkyObjectDTO } from './DTO/create-space-sky-object-dto';
import { updateSpaceSkyObjectDTO } from './DTO/update-space-sky-object-dto';
import { SpaceSkyObjectQueryDto } from './DTO/space-sky-object-query-dto';
import { SpaceSkyObject } from './space-sky-object.entity';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/response.interface';
import { SuccessMessage } from '../common/enum/success.enum';
import { ErrorMessage } from '../common/enum/error.enum';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../types/multer-file.type';

@ApiBearerAuth('JWT-auth')
@Controller('space-sky-objects')
export class SpaceSkyObjectController {
  constructor(private readonly spaceSkyObjectService: SpaceSkyObjectService) {}

  @Get()
  async getSpaceSkyObjectsPaginated(
    @Query() queryDto: SpaceSkyObjectQueryDto,
  ): Promise<PaginatedApiResponse<SpaceSkyObject>> {
    const result = await this.spaceSkyObjectService.findPaginated(queryDto);

    return {
      code: HttpStatus.OK,
      message: result.items.length > 0 ? SuccessMessage.SPACE_SKY_OBJECT_FETCHED_ALL : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
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
  async getSpaceSkyObjectById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<SpaceSkyObject | null>> {
    return await this.spaceSkyObjectService.findOneById(id).then((spaceSkyObject) => ({
      code: HttpStatus.OK,
      message: SuccessMessage.SPACE_SKY_OBJECT_FETCHED_BY_ID,
      data: spaceSkyObject,
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
        constellationName: { type: 'string' },
        discoveryDate: { type: 'string' },
        objectType: { type: 'string' },
        magnitude: { type: 'number' },
        distanceLightYears: { type: 'number' },
        description: { type: 'string' },
        discovererIds: { type: 'array', items: { type: 'number' } },
        telescopeIds: { type: 'array', items: { type: 'number' } },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async createSpaceSkyObject(
    @Body() dto: createSpaceSkyObjectDTO,
    @UploadedFile() file?: MulterFile,
  ): Promise<ApiResponse<SpaceSkyObject>> {
    return await this.spaceSkyObjectService.createSpaceSkyObject(dto, file).then((spaceSkyObject) => ({
      code: HttpStatus.CREATED,
      message: SuccessMessage.SPACE_SKY_OBJECT_CREATED,
      data: spaceSkyObject,
    }));
  }

  @Auth(Role.Moderator)
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async updateSpaceSkyObject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: updateSpaceSkyObjectDTO,
    @UploadedFile() file?: MulterFile,
  ): Promise<ApiResponse<SpaceSkyObject>> {
    return await this.spaceSkyObjectService.updateSpaceSkyObject(id, dto, file).then((spaceSkyObject) => ({
      code: HttpStatus.OK,
      message: SuccessMessage.SPACE_SKY_OBJECT_UPDATED,
      data: spaceSkyObject,
    }));
  }

  @Auth(Role.Moderator)
  @Delete('/:id')
  async deleteSpaceSkyObject(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.spaceSkyObjectService.deleteSpaceSkyObject(id);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.SPACE_SKY_OBJECT_DELETED,
      data: null,
    };
  }
}