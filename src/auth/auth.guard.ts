import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { ErrorMessage } from '../common/enum/error.enum';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { BlacklistRepository } from '../blacklist/blacklist.repository';
import { UsersRepository } from '../users/users.repository';

  @Injectable()
  export class AuthGuard implements CanActivate {
   constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private blacklistRepository: BlacklistRepository,
    private usersRepository: UsersRepository,
  ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) return true;

      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED_MESSAGE);
      }
      
      try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: jwtConstants.secret
          });
          
          if (payload.refresh) {
            throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED_MESSAGE);
          }

          if (await this.blacklistRepository.isBlacklisted(token)) {
            throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED_MESSAGE);
          }

          const user = await this.usersRepository.findOneById(payload.sub);

          if (!user || !user.isActive) {
            throw new UnauthorizedException(ErrorMessage.USER_ACCOUNT_DISABLED);
          }

          request['user'] = payload;

        } catch (error) {
          
          if (error instanceof HttpException) {
            throw error;
          }

          throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED_MESSAGE);
        }
      return true;
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }
  