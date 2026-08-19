import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, HttpStatus, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PersonalityService } from './personality.service';
import { createPersonalityDTO } from './DTO/create-personality-dto';
import { updatePersonalityDTO } from './DTO/update-personality-dto';
import { PersonalityQueryDto } from './DTO/personality-query-dto';
import { Personality } from './personality.entity';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/response.interface';
import { SuccessMessage } from '../common/enum/success.enum';
import { ErrorMessage } from '../common/enum/error.enum';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../types/multer-file.type';

@ApiBearerAuth('JWT-auth')
@Controller('personalities')
export class PersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

  @Get()
  async getPersonalitiesPaginated( @Query() queryDto: PersonalityQueryDto): Promise<PaginatedApiResponse<Personality>> {
    const result = await this.personalityService.findPaginated(queryDto);

    return {
      code: HttpStatus.OK,
      message: result.items.length > 0 ? SuccessMessage.PERSONALITY_FETCHED_ALL : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
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
  async getPersonalityById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<Personality | null>> {
    return await this.personalityService.findOneById(id).then((personality) => ({
      code: HttpStatus.OK,
      message: SuccessMessage.PERSONALITY_FETCHED_BY_ID,
      data: personality,
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
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        dateOfBirth: { type: 'string' },
        dateOfDeath: { type: 'string' },
        nationality: { type: 'string' },
        profession: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async createPersonality(@Body() dto: createPersonalityDTO, @UploadedFile() file?: MulterFile): Promise<ApiResponse<Personality>> {
    return await this.personalityService.createPersonality(dto, file).then((personality) => ({
      code: HttpStatus.CREATED,
      message: SuccessMessage.PERSONALITY_CREATED,
      data: personality,
    }));
  }

  @Auth(Role.Moderator)
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async updatePersonality(@Param('id', ParseIntPipe) id: number, @Body() dto: updatePersonalityDTO, @UploadedFile() file?: MulterFile): Promise<ApiResponse<Personality>> {
    return await this.personalityService.updatePersonality(id, dto, file).then((personality) => ({
      code: HttpStatus.OK,
      message: SuccessMessage.PERSONALITY_UPDATED,
      data: personality,
    }));
  }

  @Auth(Role.Moderator)
  @Delete('/:id')
  async deletePersonality(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.personalityService.deletePersonality(id);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.PERSONALITY_DELETED,
      data: null,
    };
  }
}