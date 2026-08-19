import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personality } from './personality.entity';
import { PersonalityController } from './personality.controller';
import { PersonalityService } from './personality.service';
import { PersonalityRepository } from './personality.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Personality])],
  controllers: [PersonalityController],
  providers: [PersonalityService, PersonalityRepository],
  exports: [PersonalityService, PersonalityRepository],
})
export class PersonalityModule {}