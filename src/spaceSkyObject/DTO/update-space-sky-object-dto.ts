import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsArray, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ObjectType } from '../../common/enum/object-type.enum';

export class updateSpaceSkyObjectDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  constellationName?: string;

  @ApiProperty({ required: false, example: '1610-11-26' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  discoveryDate?: string;

  @ApiProperty({ required: false, enum: ObjectType })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(ObjectType)
  objectType?: ObjectType;

  @ApiProperty({ required: false, example: 7.5 })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : parseFloat(value)))
  @IsNumber()
  magnitude?: number;

  @ApiProperty({ required: false, example: 1344 })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : parseFloat(value)))
  @IsNumber()
  distanceLightYears?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => parseInt(v, 10));
  })
  @IsArray()
  @IsInt({ each: true })
  discovererIds?: number[];

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => parseInt(v, 10));
  })
  @IsArray()
  @IsInt({ each: true })
  telescopeIds?: number[];
}