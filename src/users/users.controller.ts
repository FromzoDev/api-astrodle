import {Controller, Get, Request, Param, Post, Body, Patch, ParseIntPipe, Delete, HttpStatus} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { updateUserDTO } from './DTO/update-user-dto';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiResponse } from '../common/interfaces/response.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Role } from '../common/enum/roles.enum';

@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  

  @Auth(Role.Moderator)
  @Get()
  async getUsers(): Promise<ApiResponse<User[]>> {
  return await this.usersService.findAll().then(users => ({
    code: HttpStatus.OK,
    message: SuccessMessage.USER_FETCHED_ALL,
    data: users,
  }));
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
  async createUser(@Body() createUserDTO: createUserDTO): Promise<ApiResponse<User>> {
    const user = await this.usersService.createUser(createUserDTO);

    return {
      code: HttpStatus.CREATED,
      message: SuccessMessage.USER_CREATED,
      data: user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @Auth(Role.Admin)
  @Patch('/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDTO: updateUserDTO, @Request() req ): Promise<ApiResponse<User | null>> {
    const updatedUser = await this.usersService.updateUser(updateUserDTO, id, req.user);

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
