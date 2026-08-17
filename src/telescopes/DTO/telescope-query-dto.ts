import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsIn, IsInt, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FilterDto } from '../../shared/filter/filter-dto';
import { TelescopeLocation, TelescopeSpectrum } from '../../common/enum/telecope.enum';

export class TelescopeQueryDto extends FilterDto {
  @ApiProperty({ required: false, enum: TelescopeLocation, description: 'Filtrer par localisation' })
  @IsOptional()
  @IsEnum(TelescopeLocation)
  telescopeLocation?: TelescopeLocation;

  @ApiProperty({ required: false, enum: TelescopeSpectrum, description: 'Filtrer par spectre' })
  @IsOptional()
  @IsEnum(TelescopeSpectrum)
  telescopeSpectrum?: TelescopeSpectrum;

  @ApiProperty({ required: false, description: 'Filtrer les télescopes amateurs (true) ou professionnels (false)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    return value === 'true';
  })
  @IsBoolean()
  isAmateur?: boolean;

  @ApiProperty({ required: false, description: 'Filtrer par ID d\'organisation associée' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceOrganisationId?: number;

  @ApiProperty({
    required: false,
    enum: ['name', 'createdAt', 'telescopeLocation', 'telescopeSpectrum'],
    description: 'Champ sur lequel trier les résultats',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'telescopeLocation', 'telescopeSpectrum'])
  orderBy?: string;
}