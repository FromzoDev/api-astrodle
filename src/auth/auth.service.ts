import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './DTO/sign-in-dto';
import * as bcrypt from 'bcrypt';
import { ErrorMessage } from 'src/enum/error.enum';

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async signIn(signInDto: SignInDto): Promise<{ access_token: string }> {

    const { email, password } = signInDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ErrorMessage.USER_LOGIN_ERROR);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessage.USER_LOGIN_ERROR);
    }
    const payload = { id: user.id, username: user.username, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
