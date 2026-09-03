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

export class updateSpaceSkyObjectDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  constellationName?: string;

  @ApiProperty({ required: false, example: '1610-11-26' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsDateString()
  discoveryDate?: string;

  @ApiProperty({ required: false, enum: ObjectType })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsEnum(ObjectType)
  objectType?: ObjectType;

  @ApiProperty({ required: false, example: 7.5 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === '') return undefined;
    return typeof value === 'number' || typeof value === 'string'
      ? parseFloat(String(value))
      : NaN;
  })
  @IsNumber()
  magnitude?: number;

  @ApiProperty({ required: false, example: 1344 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === '') return undefined;
    return typeof value === 'number' || typeof value === 'string'
      ? parseFloat(String(value))
      : NaN;
  })
  @IsNumber()
  distanceLightYears?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  description?: string;

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
