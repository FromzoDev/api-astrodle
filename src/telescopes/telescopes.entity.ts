import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { TelescopeLocation, TelescopeSpectrum } from '../common/enum/telecope.enum';
import { SpaceOrganisation } from '../spaceOrganisations/space-organisations.entity';


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

    @Column()
    telescopeOperator: string;

    @ManyToMany(() => SpaceOrganisation, (spaceOrganisation) => spaceOrganisation.telescopes)
    @JoinTable({
      name: 'telescope_space_organisation',
      joinColumn: { name: 'telescopeId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'spaceOrganisationId', referencedColumnName: 'id' },
    })
    spaceOrganisations: SpaceOrganisation[];


    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;

}