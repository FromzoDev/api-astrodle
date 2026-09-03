import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
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

  @ManyToOne(() => Personality, (personality) => personality.discoveredObjects)
  @JoinColumn({ name: 'discovererId' })
  discoverer: Personality;

  @ManyToOne(() => Telescope, (telescope) => telescope.observations)
  @JoinColumn({ name: 'telescopeId' })
  telescope: Telescope;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
