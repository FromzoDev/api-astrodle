import {Controller, UseGuards, Get, Request, Param, NotFoundException, Post, Body, Patch, ParseIntPipe} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from './user.entity';
import { createUserDTO } from './DTO/create-user-dto';
import { updateUserDTO } from './DTO/update-user-dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  
  @UseGuards(AuthGuard)
  @Get()
  getUsers(): Promise<User[]>{
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  getUserById(@Param('id') id: number): Promise<User | null>{
    const user = this.usersService.findOneById(id);
    if(!user){
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  @UseGuards(AuthGuard)
  @Post()
  createUser(@Body() createUserDTO: createUserDTO ): Promise<User> {
    const user = this.usersService.createUser(createUserDTO);
    return user
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDTO: updateUserDTO, @Request() req ) {
    return this.usersService.updateUser(updateUserDTO, id, req.user);
}
 
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req){
    return req.user;
  }

  
}
