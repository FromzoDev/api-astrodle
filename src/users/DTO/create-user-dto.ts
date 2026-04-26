import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class createUserDTO {
  @ApiProperty(
    {
      description: 'The email of the user',
      example: 'user@example.com',
      type: String,
      title: 'Email',
    }
  )
  @IsNotEmpty()
  email: string;

  @ApiProperty(
    {
      description: 'The password of the user',
      example: 'password123',
      type: String,
      title: 'Password',
    }
  )
  @IsNotEmpty()
  password: string;

  @ApiProperty(
    {
      description: 'The first name of the user',
      example: 'John',
      type: String,
      title: 'First Name',
    }
  )
  @IsNotEmpty()
  firstName: string;

  @ApiProperty(
    {
      description: 'The username of the user',
      example: 'john_doe',
      type: String,
      title: 'Username',
    }
  )
  @IsNotEmpty()
  username: string;

  @ApiProperty(
    {
      description: 'The last name of the user',
      example: 'Doe',
      type: String,
      title: 'Last Name',
    }
  )
  @IsNotEmpty()
  lastName: string;
}
