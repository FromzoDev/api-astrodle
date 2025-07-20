
import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Get, Request, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './DTO/sign-in-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}


  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

   @Post('logout')
    async logout() {
      return this.authService.logout();
   }
}


