import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { SpaceSkyObject } from '../spaceSkyObject/space-sky-object.entity';

@Entity()
export class GuessSkyObjectGame {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => SpaceSkyObject)
  @JoinColumn({ name: 'spaceSkyObjectId' })
  spaceSkyObject: SpaceSkyObject;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: 0 })
  totalPlayed: number;

  @Column({ default: 0 })
  totalWon: number;

  @Column({ default: 0 })
  totalLost: number;

  @Column({ default: 0 })
  totalAbandoned: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  winRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  avgAttemptsUsed: number;

  @Column({ type: 'simple-json', default: '{}' })
  winCountByAttemptNumber: Record<number, number>;
}
