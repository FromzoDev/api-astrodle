import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Country } from '../common/enum/country.enum';
import { Profession } from '../common/enum/profession.enum';

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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}