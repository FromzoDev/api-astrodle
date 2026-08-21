import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { GameMode } from '../common/enum/game-mode.enum';

@Entity()
@Unique(['mode'])
export class GuessSkyObjectStats {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    mode: GameMode;

    @Column({ default: 0 })
    totalPlayed: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    avgAttemptsUsed: number;

    @Column({ type: 'simple-json', default: '{}' })
    winCountByAttemptNumber: Record<number, number>;
}