import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './DTO/sign-in-dto';
import * as bcrypt from 'bcrypt';
import { ErrorMessage } from '../common/enum/error.enum';
import { Role } from '../common/enum/roles.enum';
import { jwtConstants } from './constants';
import { BlacklistRepository } from '../blacklist/blacklist.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  private fakeHash : string; 
  
  constructor(
    private userRepository: UsersRepository,
    private jwtService: JwtService,
    private blacklistRepository: BlacklistRepository,
  ) {
    
    bcrypt.hash('fakepassword', 10).then(hash => {
      this.fakeHash = hash;
    });
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.userRepository.findOneByEmail(email);

    const passwordToCompare = user ? user.password : this.fakeHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!isPasswordValid || !user) {
      throw new UnauthorizedException(ErrorMessage.USER_LOGIN_ERROR);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ErrorMessage.USER_ACCOUNT_DISABLED);
    }

    return await this.generateTokens(user.id, user.roles);
  }

  private async generateTokens(userId: number, roles: Role[]) {
    const payload = { sub: userId, roles };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync({ ...payload, refresh: true }, { expiresIn: '7d' }), // ✅
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

      const user = await this.userRepository.findOneById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException(ErrorMessage.REFRESH_TOKEN_ERROR);
      }

      return await this.generateTokens(payload.sub, payload.roles);

    } catch (error) {
      if (error instanceof HttpException) throw error; 
      throw new UnauthorizedException(ErrorMessage.REFRESH_TOKEN_ERROR);
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    const decoded = this.jwtService.decode(token);
    await this.blacklistRepository.save(token, new Date(decoded['exp'] * 1000));
    return { message: 'Logout successful' };
  }
}