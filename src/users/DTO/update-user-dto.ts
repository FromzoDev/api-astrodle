import { IsOptional, IsNotEmpty, IsArray, IsEnum, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enum/roles.enum';

export class updateUserDTO {
  @ApiProperty({ required: false, description: 'The email of the user', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'The first name of the user', example: 'John' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty({ required: false, description: 'The username of the user', example: 'john_doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({ required: false, description: 'The last name of the user', example: 'Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({ required: false, description: 'The roles of the user', example: [Role.User, Role.Admin] })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}