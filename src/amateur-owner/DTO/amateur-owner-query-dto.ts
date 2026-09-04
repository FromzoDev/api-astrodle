import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { FilterDto } from '../../shared/filter/filter-dto';

export class AmateurOwnerQueryDto extends FilterDto {
  @ApiProperty({
    required: false,
    enum: ['firstName', 'lastName', 'createdAt'],
    description: 'Champ sur lequel trier les résultats',
  })
  @IsOptional()
  @IsIn(['firstName', 'lastName', 'createdAt'])
  orderBy?: string;
}
