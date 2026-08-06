import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, ManyToMany } from "typeorm";
import { Country } from "../common/enum/country.enum"; 
import { Telescope } from "../telescopes/telescopes.entity";

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

    @Column()
    @ManyToMany(() => Telescope, (telescope) => telescope.spaceOrganisations)
    telescopes: Telescope[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
