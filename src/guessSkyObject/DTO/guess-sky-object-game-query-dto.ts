import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { FilterDto } from '../../shared/filter/filter-dto';

export class GuessSkyObjectGameQueryDto extends FilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    return value === 'true';
  })
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({
    required: false,
    enum: ['totalPlayed', 'totalWon', 'winRate', 'avgAttemptsUsed'],
    description: 'Champ sur lequel trier',
  })
  @IsOptional()
  @IsIn(['totalPlayed', 'totalWon', 'winRate', 'avgAttemptsUsed'])
  orderBy?: string;
}