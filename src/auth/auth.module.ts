import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { BlacklistModule } from '../blacklist/blacklist.module';

@Module({
  imports: [
    UsersModule,
    BlacklistModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '3600s' },
    }),
  ],
  providers: [ AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}