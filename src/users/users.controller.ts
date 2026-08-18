import {Controller, Get, Request, Param, Post, Body, Patch, ParseIntPipe, Delete, HttpStatus, Query} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { updateUserDTO } from './DTO/update-user-dto';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/response.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MulterFile } from '../types/multer-file.type';
import { userQueryDto } from './DTO/user-query-dto';
import { ErrorMessage } from '../common/enum/error.enum';

@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}


  @Auth(Role.Moderator)
  @Get()
  async getUsersPaginated( @Query() userQueryDto: userQueryDto ): Promise<PaginatedApiResponse<User>> {

    const result = await this.usersService.findPaginated(userQueryDto);

    return {
      code: HttpStatus.OK,
      message: result.items.length > 0 ? SuccessMessage.USER_FETCHED_ALL : ErrorMessage.GLOBAL_NOT_FOUND_MESSAGE,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        lastPage: result.lastPage,
      },
    };
  }


  @Auth()
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  getProfile(@Request() req): ApiResponse<User> {
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_PROFIL_FETCHED,
      data: req.user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @Auth(Role.Moderator)
  @Get('/:id')
  async getUserById(@Param('id') id: number): Promise<ApiResponse<User | null>>{

      return await this.usersService.findOneById(id).then(user => ({
      code: HttpStatus.OK,
      message: SuccessMessage.USER_FETCHED_BY_ID,
      data: user,
    }));
  }

  @ApiBearerAuth('JWT-auth')
  @Auth(Role.Admin)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async createUser(
    @Body() createUserDTO: createUserDTO,
    @UploadedFile() file: MulterFile,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.createUser(createUserDTO, file);

    return {
      code: HttpStatus.CREATED,
      message: SuccessMessage.USER_CREATED,
      data: user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @Auth(Role.Admin)
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        email: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDTO: updateUserDTO,
    @Request() req,
    @UploadedFile() file: MulterFile,
  ): Promise<ApiResponse<User | null>> {
    const updatedUser = await this.usersService.updateUser(updateUserDTO, id, req.user, file);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_UPDATED,
      data: updatedUser,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @Auth(Role.Admin)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.usersService.deleteUser(id);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_DELETED,
      data: null,
    };
  }
}