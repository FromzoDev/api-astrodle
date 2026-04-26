import {Controller, UseGuards, Get, Request, Param, NotFoundException, Post, Body, Patch, ParseIntPipe, Delete, HttpStatus} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { updateUserDTO } from './DTO/update-user-dto';
import { SuccessMessage } from 'src/common/enum/success.enum';
import { apiResponse } from 'src/common/interfaces/response.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  
  @UseGuards(AuthGuard)
  @Get()
  async getUsers(): Promise<apiResponse<User[]>> {
  return await this.usersService.findAll().then(users => ({
    code: HttpStatus.OK,
    message: SuccessMessage.USER_FETCHED_ALL,
    data: users,
  }));
}

  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  getProfile(@Request() req): apiResponse<User> {
    return {
      code: HttpStatus.OK,
      message: 'Profil récupéré avec succès',
      data: req.user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('/:id')
  async getUserById(@Param('id') id: number): Promise<apiResponse<User | null>>{

      return await this.usersService.findOneById(id).then(user => ({
      code: HttpStatus.OK,
      message: SuccessMessage.USER_FETCHED_BY_ID,
      data: user,
    }));
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Post()
  async createUser(@Body() createUserDTO: createUserDTO): Promise<apiResponse<User>> {
    const user = await this.usersService.createUser(createUserDTO);

    return {
      code: HttpStatus.CREATED,
      message: 'Utilisateur créé avec succès',
      data: user,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Patch('/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDTO: updateUserDTO, @Request() req ): Promise<apiResponse<User | null>> {
    const updatedUser = await this.usersService.updateUser(updateUserDTO, id, req.user);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_UPDATED,
      data: updatedUser,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<apiResponse<null>> {
    await this.usersService.deleteUser(id);

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_DELETED,
      data: null,
    };
  }
}
