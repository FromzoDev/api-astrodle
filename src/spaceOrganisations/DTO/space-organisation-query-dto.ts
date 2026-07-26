import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsEnum } from 'class-validator';
import { FilterDto } from '../../shared/filter/filter-dto';
import { Country } from '../../common/enum/country.enum'; 

export class SpaceOrganisationQueryDto extends FilterDto {
  @ApiProperty({ required: false, enum: Country, description: 'Filtrer par pays' })
  @IsOptional()
  @IsEnum(Country)
  country?: Country;

  @ApiProperty({
    required: false,
    enum: ['name', 'createdAt', 'country'],
    description: 'Champ sur lequel trier les résultats',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'country'])
  orderBy?: string;
}