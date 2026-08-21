import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { GameType } from '../../common/enum/game-type.enum';
import { GameMode } from '../../common/enum/game-mode.enum';

@Entity()
@Unique(['gameType', 'mode'])
export class GameStats {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    gameType: GameType;

    @Column()
    mode: GameMode;

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
}