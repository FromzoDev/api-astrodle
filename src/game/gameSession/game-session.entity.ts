import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { GameType } from '../../common/enum/game-type.enum';
import { GameMode } from '../../common/enum/game-mode.enum';
import { GameStatus } from '../../common/enum/game-status.enum';

@Entity()
export class GameSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameType: GameType;

    @Column()
    contentId: number;

    @Column()
    mode: GameMode;

    @Column({ type: 'enum', enum: GameStatus, default: GameStatus.InProgress })
    status: GameStatus;

    @Column({ type: 'simple-json', nullable: true })
    gameData?: Record<string, any>;

    @CreateDateColumn()
    startedAt: Date;

    @Column({ nullable: true })
    finishedAt?: Date;
}