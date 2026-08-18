import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsEnum, IsBoolean } from 'class-validator';
import { FilterDto } from '../../shared/filter/filter-dto';
import { Role } from '../../common/enum/roles.enum';
import { Transform, Type } from 'class-transformer';

export class userQueryDto extends FilterDto {
    @ApiProperty({ required: false, enum: Role, description: 'Filtrer par rôle' })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiProperty({ required: false, description: 'Filtrer par prénom' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ required: false, description: 'Filtrer par nom de famille' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ required: false, description: 'Filtrer par nom d\'utilisateur' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({ required: false, description: 'Filtrer par email' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ required: false, description: 'Filtrer les utilisateurs actifs (true) ou inactifs (false)' })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined) return undefined;
        return value === 'true';
    })
    @IsBoolean()
    isActive?: boolean;


    @ApiProperty({
        required: false,
        enum: ['name', 'createdAt'],
        description: 'Champ sur lequel trier les résultats',
    })
    @IsOptional()
    @IsIn(['firstName', 'lastName', 'email', 'username', 'createdAt'])
    orderBy?: string;
}