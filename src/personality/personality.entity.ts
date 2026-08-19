import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Country } from '../common/enum/country.enum';
import { Profession } from '../common/enum/profession.enum';
import { SpaceSkyObject } from '../spaceSkyObject/space-sky-object.entity';

@Entity()
export class Personality {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    dateOfBirth: Date;

    @Column({ nullable: true })
    dateOfDeath?: Date;

    @Column()
    nationality: Country;

    @Column()
    profession: Profession;

    @Column()
    description: string;

    @Column({ nullable: true })
    personalityImage?: string;

    @ManyToMany(() => SpaceSkyObject, (spaceSkyObject) => spaceSkyObject.discoverers)
    discoveredObjects?: SpaceSkyObject[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}