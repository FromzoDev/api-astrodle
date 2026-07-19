import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Country } from "../common/enum/country.enum"; 

@Entity()
export class SpaceOrganisation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description:  string;

    @Column()
    country: Country;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}
