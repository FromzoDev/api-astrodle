import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SuccessMessage } from '../common/enum/success.enum';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from '../users/role.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'signIn' | 'refresh' | 'logout'>>;

  const tokens = { access_token: 'access-token', refresh_token: 'refresh-token' };

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(CustomThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('signIn', () => {
    it('delegates to authService.signIn and wraps the result in an ApiResponse', async () => {
      authService.signIn.mockResolvedValue(tokens);
      const signInDto = { email: 'user@example.com', password: 'password123' };

      const result = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual({
        code: HttpStatus.OK,
        message: SuccessMessage.USER_LOGGED_IN,
        data: tokens,
      });
    });
  });

  describe('logout', () => {
    it('extracts the bearer token from the request and delegates to authService.logout', async () => {
      authService.logout.mockResolvedValue({ message: 'Logout successful' });
      const req = {
        headers: { authorization: 'Bearer some-jwt-token' },
      } as Request;

      const result = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('some-jwt-token');
      expect(result).toEqual({
        code: HttpStatus.OK,
        message: SuccessMessage.USER_LOGGED_OUT,
        data: null,
      });
    });
  });

  describe('refresh', () => {
    it('delegates to authService.refresh with the provided refresh token', async () => {
      authService.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh('some-refresh-token');

      expect(authService.refresh).toHaveBeenCalledWith('some-refresh-token');
      expect(result).toEqual({
        code: HttpStatus.OK,
        message: SuccessMessage.TOKEN_REFRESHED,
        data: tokens,
      });
    });
  });
});
