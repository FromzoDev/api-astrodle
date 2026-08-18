import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable, JoinColumn } from 'typeorm';
import { TelescopeLocation, TelescopeSpectrum } from '../common/enum/telecope.enum';
import { SpaceOrganisation } from '../spaceOrganisations/space-organisations.entity';
import { AmateurOwner } from '../amateur-owner/amateur-owner.entity';

@Entity()
export class Telescope {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    telescopeImage: string;
    
    @Column()
    telescopeLocation: TelescopeLocation;

    @Column()
    telescopeSpectrum: TelescopeSpectrum;

    @Column({ default: false })
    isAmateur: boolean;

    @ManyToMany(() => SpaceOrganisation, (spaceOrganisation) => spaceOrganisation.telescopes)
    @JoinTable({
      name: 'telescope_space_organisation',
      joinColumn: { name: 'telescopeId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'spaceOrganisationId', referencedColumnName: 'id' },
    })
    spaceOrganisations?: SpaceOrganisation[];

    @ManyToOne(() => AmateurOwner, (amateurOwner) => amateurOwner.telescopes, { nullable: true })
    @JoinColumn({ name: 'amateurOwnerId' })
    amateurOwner?: AmateurOwner;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}