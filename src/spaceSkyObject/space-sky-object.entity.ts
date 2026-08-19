import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType } from '../common/enum/object-type.enum';
import { Personality } from '../personality/personality.entity';
import { Telescope } from '../telescopes/telescopes.entity';

@Entity()
export class SpaceSkyObject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    constellationName: string;

    @Column()
    discoveryDate: Date;

    @Column()
    objectType: ObjectType;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    magnitude: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    distanceLightYears: number;

    @Column({ nullable: true })
    objectImage?: string;

    @Column()
    description: string;

    @ManyToMany(() => Personality, (personality) => personality.discoveredObjects)
    @JoinTable({
      name: 'space_sky_object_personality',
      joinColumn: { name: 'spaceSkyObjectId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'personalityId', referencedColumnName: 'id' },
    })
    discoverers?: Personality[];

    @ManyToMany(() => Telescope, (telescope) => telescope.observations)
    @JoinTable({
      name: 'space_sky_object_telescope',
      joinColumn: { name: 'spaceSkyObjectId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'telescopeId', referencedColumnName: 'id' },
    })
    observedByTelescopes?: Telescope[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}