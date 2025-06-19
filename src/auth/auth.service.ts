import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './DTO/sign-in-dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn( signInDto: SignInDto): Promise<{ access_token: string }> {
    const { email, password} = signInDto;
    const user = await this.usersService.findOneByEmail(email);
    if (user?.password !== password) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id,  id: user.id, username: user.username , email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
