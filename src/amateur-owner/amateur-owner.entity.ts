import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Telescope } from '../telescopes/telescopes.entity';

@Entity()
export class AmateurOwner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ default: false })
  consentToDisplayName: boolean;

  @OneToMany(() => Telescope, (telescope) => telescope.amateurOwner)
  telescopes: Telescope[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
