import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsIn } from 'class-validator';
import { FilterDto } from '../../shared/filter/filter-dto';
import { Country } from '../../common/enum/country.enum';
import { Profession } from '../../common/enum/profession.enum';

export class PersonalityQueryDto extends FilterDto {
  @ApiProperty({ required: false, enum: Country, description: 'Filtrer par nationalité' })
  @IsOptional()
  @IsEnum(Country)
  nationality?: Country;

  @ApiProperty({ required: false, enum: Profession, description: 'Filtrer par profession' })
  @IsOptional()
  @IsEnum(Profession)
  profession?: Profession;

  @ApiProperty({
    required: false,
    enum: ['firstName', 'lastName', 'dateOfBirth', 'createdAt'],
    description: 'Champ sur lequel trier les résultats',
  })
  @IsOptional()
  @IsIn(['firstName', 'lastName', 'dateOfBirth', 'createdAt'])
  orderBy?: string;
}