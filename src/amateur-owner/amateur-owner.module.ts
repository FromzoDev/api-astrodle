import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmateurOwner } from './amateur-owner.entity';
import { AmateurOwnerController } from './amateur-owner.controller';
import { AmateurOwnerService } from './amateur-owner.service';
import { AmateurOwnerRepository } from './amateur-owner.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AmateurOwner])],
  controllers: [AmateurOwnerController],
  providers: [AmateurOwnerService, AmateurOwnerRepository],
  exports: [AmateurOwnerService, AmateurOwnerRepository],
})
export class AmateurOwnerModule {}