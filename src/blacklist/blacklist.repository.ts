import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBlacklist } from './blacklist.entity';

@Injectable()
export class BlacklistRepository {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly blacklistRepository: Repository<TokenBlacklist>,
  ) {}

  async save(token: string, expiresAt: Date): Promise<void> {
    await this.blacklistRepository.save({ token, expiresAt });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const found = await this.blacklistRepository.findOne({ where: { token } });
    return !!found;
  }

  async clean(): Promise<void> {
    await this.blacklistRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}