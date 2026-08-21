import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitGuessDTO {
  @ApiProperty({ example: "Nébuleuse d'Orion" })
  @IsString()
  @IsNotEmpty()
  guess: string;
}