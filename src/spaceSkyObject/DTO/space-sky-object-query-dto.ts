import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterDto } from '../../shared/filter/filter-dto';
import { ObjectType } from '../../common/enum/object-type.enum';

export class SpaceSkyObjectQueryDto extends FilterDto {
  @ApiProperty({ required: false, enum: ObjectType, description: 'Filtrer par type d\'objet' })
  @IsOptional()
  @IsEnum(ObjectType)
  objectType?: ObjectType;

  @ApiProperty({ required: false, description: 'Filtrer par ID de découvreur' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  discovererId?: number;

  @ApiProperty({ required: false, description: 'Filtrer par ID de télescope observateur' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  telescopeId?: number;

  @ApiProperty({
    required: false,
    enum: ['name', 'discoveryDate', 'magnitude', 'distanceLightYears', 'createdAt'],
    description: 'Champ sur lequel trier les résultats',
  })
  @IsOptional()
  @IsIn(['name', 'discoveryDate', 'magnitude', 'distanceLightYears', 'createdAt'])
  orderBy?: string;
}