import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Country } from '../../common/enum/country.enum';
import { Profession } from '../../common/enum/profession.enum';

export class createPersonalityDTO {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1564-02-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ required: false, example: '1642-01-08' })
  @IsOptional()
  @IsDateString()
  dateOfDeath?: string;

  @ApiProperty({ enum: Country })
  @IsEnum(Country)
  nationality: Country;

  @ApiProperty({ enum: Profession })
  @IsEnum(Profession)
  profession: Profession;

  @ApiProperty()
  @IsString()
  description: string;
}