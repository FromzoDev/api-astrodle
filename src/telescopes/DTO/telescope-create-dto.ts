import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsInt, IsOptional, IsBoolean } from 'class-validator';
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
  @IsBoolean()
  isAmateur?: boolean;

  @ApiProperty({ required: false, type: [Number], description: 'IDs des organisations associées (télescope professionnel)' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  spaceOrganisationIds?: number[];

  @ApiProperty({ required: false, description: 'ID du propriétaire amateur (télescope amateur)' })
  @IsOptional()
  @IsInt()
  amateurOwnerId?: number;
}