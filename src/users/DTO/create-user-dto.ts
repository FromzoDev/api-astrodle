import { IsNotEmpty } from 'class-validator';

export class createUserDTO {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  lastName: string;
}
