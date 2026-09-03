import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ObjectType } from '../../common/enum/object-type.enum';

export class createSpaceSkyObjectDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  constellationName: string;

  @ApiProperty({ example: '1610-11-26' })
  @IsDateString()
  discoveryDate: string;

  @ApiProperty({ enum: ObjectType })
  @IsEnum(ObjectType)
  objectType: ObjectType;

  @ApiProperty({ example: 7.5 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'number' || typeof value === 'string'
      ? parseFloat(String(value))
      : NaN,
  )
  @IsNumber()
  magnitude: number;

  @ApiProperty({ example: 1344, description: 'Distance en années-lumière' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'number' || typeof value === 'string'
      ? parseFloat(String(value))
      : NaN,
  )
  @IsNumber()
  distanceLightYears: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false, description: 'ID du découvreur' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  discovererId?: number;

  @ApiProperty({ required: false, description: 'ID du télescope observateur' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  telescopeId?: number;
}
