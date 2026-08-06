import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsInt } from 'class-validator';
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

  @ApiProperty()
  @IsString()
  telescopeOperator: string;

  @ApiProperty({ type: [Number], description: 'IDs des organisations associées' })
  @IsArray()
  @IsInt({ each: true })
  spaceOrganisationIds: number[];
}