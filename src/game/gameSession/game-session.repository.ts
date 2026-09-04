import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { GameSession } from './game-session.entity';
import { GameStatus } from '../../common/enum/game-status.enum';

@Injectable()
export class GameSessionRepository {
  constructor(
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
  ) {}

  async findOneById(id: string): Promise<GameSession | null> {
    return this.gameSessionRepository.findOneBy({ id });
  }

  async create(data: Partial<GameSession>): Promise<GameSession> {
    const session = this.gameSessionRepository.create(data);
    return this.gameSessionRepository.save(session);
  }

  async update(
    id: string,
    updateData: Partial<GameSession>,
  ): Promise<GameSession | null> {
    await this.gameSessionRepository.update(id, updateData);
    return this.findOneById(id);
  }

  async finish(id: string, status: GameStatus): Promise<GameSession | null> {
    await this.gameSessionRepository.update(id, {
      status,
      finishedAt: new Date(),
    });
    return this.findOneById(id);
  }

  async findAbandonableSessions(cutoffDate: Date): Promise<GameSession[]> {
    return this.gameSessionRepository.find({
      where: {
        status: GameStatus.InProgress,
        startedAt: LessThan(cutoffDate),
      },
    });
  }

  async abandonSessions(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return;

    await this.gameSessionRepository
      .createQueryBuilder()
      .update(GameSession)
      .set({ status: GameStatus.Abandoned, finishedAt: () => 'NOW()' })
      .where('id IN (:...sessionIds)', { sessionIds })
      .execute();
  }
}
