import { MiddlewareConsumer, Module, OnModuleInit, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { UserSeed } from './users/user.seed';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { PaginationModule } from './shared/pagination/pagination.module';
import { SpaceOrganisationsModule } from './spaceOrganisations/space-organisations.module';
import { ConfigModule } from '@nestjs/config';
import { FilterModule } from './shared/filter/filter.module';
import { ImageUploadModule } from './shared/upload/image-upload.module';
import { TelescopeModule } from './telescopes/telescopes.module';
import { AmateurOwnerModule } from './amateur-owner/amateur-owner.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { ObjectTypeModule } from './object-type/object-type.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 5,    
    }]),
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'postgres',
      synchronize: true,
      autoLoadEntities: true,
    }),
    AuthModule,
    BlacklistModule,
    UsersModule,
    SpaceOrganisationsModule,
    PaginationModule,
    FilterModule,
    ImageUploadModule,
    AmateurOwnerModule,
    TelescopeModule,
    ObjectTypeModule,
  ],
  
  controllers: [AppController],
  providers: [AppService],
})


export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    
    const userRepository = this.dataSource.getRepository(User); 
    
    await UserSeed.run(userRepository);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL }); 
  }
}
