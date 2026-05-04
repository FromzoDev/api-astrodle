import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './DTO/sign-in-dto';
import * as bcrypt from 'bcrypt';
import { ErrorMessage } from '../common/enum/error.enum';
import { Role } from '../common/enum/roles.enum';
import { jwtConstants } from './constants';
import { BlacklistRepository } from '../blacklist/blacklist.repository';

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private blacklistRepository: BlacklistRepository,

  ) { }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    try {
      const user = await this.usersService.findOneByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException(ErrorMessage.USER_LOGIN_ERROR);
      }

      return await this.generateTokens(user.id, user.roles);

    } catch (error) {
      throw new UnauthorizedException(ErrorMessage.USER_LOGIN_ERROR);
    }
  }

  private async generateTokens(userId: number, roles: Role[]) {
    const payload = { sub: userId, roles };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return { access_token, refresh_token };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtConstants.secret,
      });

      if (!payload.refresh) {
        throw new UnauthorizedException(ErrorMessage.REFRESH_TOKEN_ERROR);
      }

      return await this.generateTokens(payload.sub, payload.roles);
      

    } catch {
      throw new UnauthorizedException(ErrorMessage.REFRESH_TOKEN_ERROR);
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    const decoded = this.jwtService.decode(token);
     await this.blacklistRepository.save(token, new Date(decoded['exp'] * 1000));
    return { message: 'Logout successful' };
  }
}
