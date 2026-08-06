import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsInt, IsOptional } from 'class-validator';
import { TelescopeLocation, TelescopeSpectrum } from '../../common/enum/telecope.enum';

export class updateTelescopeDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: TelescopeLocation })
  @IsOptional()
  @IsEnum(TelescopeLocation)
  telescopeLocation?: TelescopeLocation;

  @ApiProperty({ required: false, enum: TelescopeSpectrum })
  @IsOptional()
  @IsEnum(TelescopeSpectrum)
  telescopeSpectrum?: TelescopeSpectrum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telescopeOperator?: string;

  @ApiProperty({ required: false, type: [Number], description: 'IDs des organisations associées' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  spaceOrganisationIds?: number[];
}