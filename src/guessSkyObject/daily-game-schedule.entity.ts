import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { GuessSkyObjectGame } from './guess-sky-object-game.entity';

@Entity()
@Unique(['date'])
export class DailyGameSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    date: string;

    @OneToOne(() => GuessSkyObjectGame)
    @JoinColumn({ name: 'guessSkyObjectGameId' })
    guessSkyObjectGame: GuessSkyObjectGame;

    @CreateDateColumn()
    createdAt: Date;
}