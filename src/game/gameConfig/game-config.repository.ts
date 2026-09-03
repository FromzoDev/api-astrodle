import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { GameConfig } from './game-config.entity';
import { GameMode } from '../../common/enum/game-mode.enum';
import { GameType } from '../../common/enum/game-type.enum';

@Injectable()
export class GameConfigRepository {
  constructor(
    @InjectRepository(GameConfig)
    private readonly gameConfigRepository: Repository<GameConfig>,
  ) {}

  async findAll(): Promise<GameConfig[]> {
    return this.gameConfigRepository.find();
  }

  async findOneById(id: number): Promise<GameConfig | null> {
    return this.gameConfigRepository.findOneBy({ id });
  }

  async findOneByGameTypeAndMode(
    gameType: GameType,
    mode: GameMode,
  ): Promise<GameConfig | null> {
    return this.gameConfigRepository.findOneBy({ gameType, mode });
  }

  async findEnabledByMode(mode: GameMode): Promise<GameConfig[]> {
    return this.gameConfigRepository.findBy({ mode, isEnabled: true });
  }

  async createGameConfig(data: Partial<GameConfig>): Promise<GameConfig> {
    try {
      const gameConfig = this.gameConfigRepository.create(data);
      return await this.gameConfigRepository.save(gameConfig);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('duplicate')
      ) {
        throw new ConflictException('Cette combinaison jeu/mode existe déjà');
      }
      throw error;
    }
  }

  async updateGameConfig(
    id: number,
    updateData: Partial<GameConfig>,
  ): Promise<GameConfig | null> {
    await this.gameConfigRepository.update(id, updateData);
    return this.findOneById(id);
  }

  async deleteGameConfig(id: number): Promise<void> {
    await this.gameConfigRepository.delete(id);
  }
}
