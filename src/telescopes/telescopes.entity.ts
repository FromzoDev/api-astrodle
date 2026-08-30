import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, ManyToOne, JoinTable, JoinColumn, OneToMany } from 'typeorm';
import { TelescopeLocation, TelescopeSpectrum } from '../common/enum/telecope.enum';
import { SpaceOrganisation } from '../spaceOrganisations/space-organisations.entity';
import { AmateurOwner } from '../amateur-owner/amateur-owner.entity';
import { SpaceSkyObject } from '../spaceSkyObject/space-sky-object.entity';

@Entity()
export class Telescope {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    telescopeImage?: string;
    
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

    @OneToMany(() => SpaceSkyObject, (spaceSkyObject) => spaceSkyObject.telescope)
    observations?: SpaceSkyObject[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}