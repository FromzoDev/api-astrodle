import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TelescopeLocation, TelescopeSpectrum } from '../../common/enum/telecope.enum';

export class updateTelescopeDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: TelescopeLocation })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(TelescopeLocation)
  telescopeLocation?: TelescopeLocation;

  @ApiProperty({ required: false, enum: TelescopeSpectrum })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(TelescopeSpectrum)
  telescopeSpectrum?: TelescopeSpectrum;

  @ApiProperty({ required: false, description: 'Indique si le télescope est amateur' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isAmateur?: boolean;

  @ApiProperty({ required: false, type: [Number], description: 'IDs des organisations associées' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => parseInt(v, 10));
  })
  @IsArray()
  @IsInt({ each: true })
  spaceOrganisationIds?: number[];

  @ApiProperty({ required: false, description: 'ID du propriétaire amateur' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt()
  amateurOwnerId?: number;
}