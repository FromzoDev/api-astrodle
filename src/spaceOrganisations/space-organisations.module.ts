import { Module } from '@nestjs/common';
import { SpaceOrganisationService } from './space-organisation.service';
import { SpaceOrganisationController } from './space-organisation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceOrganisation } from './space-organisations.entity';
import { SpaceOrganisationRepository } from './space-organisation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceOrganisation])],
  controllers: [SpaceOrganisationController],
  providers: [SpaceOrganisationService, SpaceOrganisationRepository],
  exports: [SpaceOrganisationService, SpaceOrganisationRepository],
})
export class SpaceOrganisationsModule {}
