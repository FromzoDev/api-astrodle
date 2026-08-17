import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Telescope } from './telescopes.entity';
import { TelescopeController } from './telescopes.controller';
import { TelescopeService } from './telescopes.service';
import { TelescopeRepository } from './telescopes.repository';
import { SpaceOrganisationsModule } from '../spaceOrganisations/space-organisations.module';
import { AmateurOwnerModule } from '../amateur-owner/amateur-owner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Telescope]),
    SpaceOrganisationsModule,
    AmateurOwnerModule,
  ],
  controllers: [TelescopeController],
  providers: [TelescopeService, TelescopeRepository],
  exports: [TelescopeService, TelescopeRepository],
})
export class TelescopeModule {}