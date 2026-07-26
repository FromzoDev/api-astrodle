import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../pagination/pagination-dto';

export class FilterDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'Terme de recherche global' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], description: 'Direction du tri' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC';
}