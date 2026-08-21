import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';
import { GameMode } from '../../common/enum/game-mode.enum';
import { GameType } from '../../common/enum/game-type.enum';

@Entity()
@Unique(['gameType', 'mode'])
export class GameConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    gameType: GameType;

    @Column()
    mode: GameMode;

    @Column({ default: true })
    isEnabled: boolean;

    @UpdateDateColumn()
    updatedAt: Date;
}