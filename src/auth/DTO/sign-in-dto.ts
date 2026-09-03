import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
    type: String,
    title: 'Email',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
    type: String,
    title: 'Password',
  })
  password: string;
}
