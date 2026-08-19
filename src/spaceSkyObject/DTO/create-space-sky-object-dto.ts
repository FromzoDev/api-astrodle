import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsArray, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  magnitude: number;

  @ApiProperty({ example: 1344, description: 'Distance en années-lumière' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  distanceLightYears: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false, type: [Number], description: 'IDs des découvreurs (Personality)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => parseInt(v, 10));
  })
  @IsArray()
  @IsInt({ each: true })
  discovererIds?: number[];

  @ApiProperty({ required: false, type: [Number], description: 'IDs des télescopes ayant observé cet objet' })
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