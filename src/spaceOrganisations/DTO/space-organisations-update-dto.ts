import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../common/enum/country.enum';

export class updateSpaceOrganisationDTO {

    @ApiProperty({
        required: false,
        description: 'The name of the space organisation',
        example: 'SpaceX',
        type: String,
        title: 'Name',
    })
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsString()
    name?: string;

    @ApiProperty({
        required: false,
        description: 'The description of the space organisation',
        example: 'A private aerospace manufacturer and space transportation services company.',
        type: String,
        title: 'Description',
    })
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsString()
    description?: string;

    @ApiProperty({
        required: false,
        description: 'The country of the space organisation',
        example: Country.Austria,
        type: String,
        title: 'Country',
    })
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsEnum(Country)
    country?: Country;

}