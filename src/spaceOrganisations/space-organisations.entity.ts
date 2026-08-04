import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";
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

    @Column({nullable: true})
    agencyLogo: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
