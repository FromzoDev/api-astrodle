import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TelescopeLocation, TelescopeSpectrum } from '../../common/enum/telecope.enum';

export class createTelescopeDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: TelescopeLocation })
  @IsEnum(TelescopeLocation)
  telescopeLocation: TelescopeLocation;

  @ApiProperty({ enum: TelescopeSpectrum })
  @IsEnum(TelescopeSpectrum)
  telescopeSpectrum: TelescopeSpectrum;

  @ApiProperty({ default: false, description: 'Indique si le télescope est amateur' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isAmateur?: boolean;

  @ApiProperty({ required: false, type: [Number], description: 'IDs des organisations associées (télescope professionnel)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => parseInt(v, 10));
  })
  @IsArray()
  @IsInt({ each: true })
  spaceOrganisationIds?: number[];

  @ApiProperty({ required: false, description: 'ID du propriétaire amateur (télescope amateur)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt()
  amateurOwnerId?: number;
}