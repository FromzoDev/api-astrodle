import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AmateurOwnerService } from './amateur-owner.service';
import { createAmateurOwnerDTO } from './DTO/create-amateur-owner-dto';
import { updateAmateurOwnerDTO } from './DTO/update-amateur-owner-dto';
import { AmateurOwnerQueryDto } from './DTO/amateur-owner-query-dto';
import { AmateurOwner } from './amateur-owner.entity';
import {
  ApiResponse,
  PaginatedApiResponse,
} from '../common/interfaces/response.interface';
import { SuccessMessage } from '../common/enum/success.enum';
import { ErrorMessage } from '../common/enum/error.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiBearerAuth('JWT-auth')
@Controller('amateur-owners')
export class AmateurOwnerController {
  constructor(private readonly amateurOwnerService: AmateurOwnerService) {}

  @Auth(Role.Moderator)
  @Get()
  async getAmateurOwnersPaginated(
    @Query() queryDto: AmateurOwnerQueryDto,
  ): Promise<PaginatedApiResponse<AmateurOwner>> {
    const result = await this.amateurOwnerService.findPaginated(queryDto);

    return {
      code: HttpStatus.OK,
      message:
        result.items.length > 0
          ? SuccessMessage.AMATEUR_OWNER_FETCHED_ALL
          : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        lastPage: result.lastPage,
      },
    };
  }

  @Auth(Role.Moderator)
  @Get('/:id')
  async getAmateurOwnerById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<AmateurOwner | null>> {
    return await this.amateurOwnerService
      .findOneById(id)
      .then((amateurOwner) => ({
        code: HttpStatus.OK,
        message: SuccessMessage.AMATEUR_OWNER_FETCHED_BY_ID,
        data: amateurOwner,
      }));
  }

  @Auth(Role.Moderator)
  @Post()
  async createAmateurOwner(
    @Body() dto: createAmateurOwnerDTO,
  ): Promise<ApiResponse<AmateurOwner>> {
    return await this.amateurOwnerService
      .createAmateurOwner(dto)
      .then((amateurOwner) => ({
        code: HttpStatus.CREATED,
        message: SuccessMessage.AMATEUR_OWNER_CREATED,
        data: amateurOwner,
      }));
  }

  @Auth(Role.Moderator)
  @Patch('/:id')
  async updateAmateurOwner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: updateAmateurOwnerDTO,
  ): Promise<ApiResponse<AmateurOwner>> {
    return await this.amateurOwnerService
      .updateAmateurOwner(id, dto)
      .then((amateurOwner) => ({
        code: HttpStatus.OK,
        message: SuccessMessage.AMATEUR_OWNER_UPDATED,
        data: amateurOwner,
      }));
  }

  @Auth(Role.Moderator)
  @Delete('/:id')
  async deleteAmateurOwner(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.amateurOwnerService.deleteAmateurOwner(id);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.AMATEUR_OWNER_DELETED,
      data: null,
    };
  }
}
