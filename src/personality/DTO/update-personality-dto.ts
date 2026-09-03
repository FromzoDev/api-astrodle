import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Country } from '../../common/enum/country.enum';
import { Profession } from '../../common/enum/profession.enum';

export class updatePersonalityDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, example: '1564-02-15' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ required: false, example: '1642-01-08' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsDateString()
  dateOfDeath?: string;

  @ApiProperty({ required: false, enum: Country })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsEnum(Country)
  nationality?: Country;

  @ApiProperty({ required: false, enum: Profession })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsEnum(Profession)
  profession?: Profession;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  description?: string;
}
