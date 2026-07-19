import { Module } from '@nestjs/common';
import { SpaceOrganisationService } from './space-organisation.service';
import { SpaceOrganisationController } from './space-organisation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceOrganisation } from './space-organisations.entity';
import { SpaceOrganisationRepository } from './space-organisation.repository';
import { BlacklistModule } from '../blacklist/blacklist.module';



@Module({
  imports: [TypeOrmModule.forFeature([SpaceOrganisation]), BlacklistModule],
  controllers: [SpaceOrganisationController],
  providers: [SpaceOrganisationService, SpaceOrganisationRepository],
  exports: [SpaceOrganisationService, SpaceOrganisationRepository],
})
export class SpaceOrganisationsModule {}
