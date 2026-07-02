import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBlacklist } from './blacklist.entity';
import { BlacklistRepository } from './blacklist.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TokenBlacklist])],
  providers: [BlacklistRepository],
  exports: [BlacklistRepository], 
})
export class BlacklistModule {}