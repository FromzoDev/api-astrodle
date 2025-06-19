import { IsNotEmpty } from 'class-validator';

export class updateUserDTO {

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  lastName: string;
}