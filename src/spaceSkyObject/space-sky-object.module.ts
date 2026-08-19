import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceSkyObject } from './space-sky-object.entity';
import { SpaceSkyObjectController } from './space-sky-object.controller';
import { SpaceSkyObjectService } from './space-sky-object.service';
import { SpaceSkyObjectRepository } from './space-sky-object.repository';
import { PersonalityModule } from '../personality/personality.module';
import { TelescopeModule } from '../telescopes/telescopes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpaceSkyObject]),
    PersonalityModule,
    TelescopeModule,
  ],
  controllers: [SpaceSkyObjectController],
  providers: [SpaceSkyObjectService, SpaceSkyObjectRepository],
  exports: [SpaceSkyObjectService, SpaceSkyObjectRepository],
})
export class SpaceSkyObjectModule {}