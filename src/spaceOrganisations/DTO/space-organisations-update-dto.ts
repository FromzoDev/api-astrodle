import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../common/enum/country.enum';

export class updateSpaceOrganisationDTO {
 
     @ApiProperty(
         {
             description: 'The name of the space organisation',
             example: 'SpaceX',
             type: String,
             title: 'Name',
         }
     )
     @IsNotEmpty()
     name: string;
 
     @ApiProperty(
         {
             description: 'The description of the space organisation',
             example: 'A private aerospace manufacturer and space transportation services company.',
             type: String,
             title: 'Description',
         }
     )
     @IsNotEmpty()
     description: string;
 
     @ApiProperty(
         {
             description: 'The country of the space organisation',
             example: Country.Austria,
             type: String,
             title: 'Country',
         }
     )
     @IsNotEmpty()
     @IsEnum(Country)
     country: Country;

     
     

}