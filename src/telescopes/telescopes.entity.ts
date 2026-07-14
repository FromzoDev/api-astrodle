import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TelescopeLocation, TelescopeSpectrum } from '../common/enum/telecope.enum';


@Entity()
export class Telescope {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    image: string;
    
    @Column()
    telecopeLocation: TelescopeLocation;

    @Column()
    telescopeSpectrum: TelescopeSpectrum;

    @Column()
    telescopeOperator: string;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;

}