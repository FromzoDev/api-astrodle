import { Module } from '@nestjs/common';
import { ObjectTypeController } from './object-type.controller';

@Module({
  controllers: [ObjectTypeController],
})
export class ObjectTypeModule {}
