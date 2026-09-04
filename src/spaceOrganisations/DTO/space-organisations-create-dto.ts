import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../common/enum/country.enum';

export class createspaceOrganisationDTO {
  @ApiProperty({
    description: 'The name of the space organisation',
    example: 'SpaceX',
    type: String,
    title: 'Name',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the space organisation',
    example:
      'A private aerospace manufacturer and space transportation services company.',
    type: String,
    title: 'Description',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description:
      'The countries of the space organisation, as a JSON-stringified array',
    example: JSON.stringify([Country.France, Country.Germany]),
    type: String,
    title: 'Countries',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (JSON.parse(value) as unknown) : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Country, { each: true })
  countries: Country[];

  @ApiProperty({
    description: 'The logo file of the space organisation',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  logo?: any;
}
