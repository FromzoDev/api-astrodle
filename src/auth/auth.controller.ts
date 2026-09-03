import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './DTO/sign-in-dto';
import { Public } from '../common/decorators/public.decorator';
import { Auth } from '../common/decorators/auth.decorator';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import { ApiResponse } from '../common/interfaces/response.interface';
import { SuccessMessage } from '../common/enum/success.enum';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CustomThrottlerGuard)
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    const tokens = await this.authService.signIn(signInDto);
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_LOGGED_IN,
      data: tokens,
    };
  }

  @Auth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req): Promise<ApiResponse<null>> {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(token);
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.USER_LOGGED_OUT,
      data: null,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body('refresh_token') refreshToken: string,
  ): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    const tokens = await this.authService.refresh(refreshToken);
    return {
      code: HttpStatus.OK,
      message: SuccessMessage.TOKEN_REFRESHED,
      data: tokens,
    };
  }
}
