import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { BlacklistRepository } from '../blacklist/blacklist.repository';
import { Role } from '../common/enum/roles.enum';
import { User } from '../users/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Pick<UsersRepository, 'findOneByEmail' | 'findOneById'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync' | 'decode'>>;
  let blacklistRepository: jest.Mocked<Pick<BlacklistRepository, 'save'>>;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      profilePicture: null,
      password: 'hashed-password',
      roles: [Role.User],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  beforeEach(async () => {
    userRepository = {
      findOneByEmail: jest.fn(),
      findOneById: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };
    blacklistRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: BlacklistRepository, useValue: blacklistRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Let the fake hash promise in the constructor resolve before each test.
    await new Promise((resolve) => setImmediate(resolve));
  });

  describe('signIn', () => {
    it('returns access_token and refresh_token on success', async () => {
      const user = buildUser();
      userRepository.findOneByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.signIn({
        email: user.email,
        password: 'correct-password',
      });

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: user.id, roles: user.roles },
        { expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: user.id, roles: user.roles, refresh: true },
        { expiresIn: '7d' },
      );
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      const user = buildUser();
      userRepository.findOneByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.signIn({ email: user.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is not found', async () => {
      userRepository.findOneByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.signIn({ email: 'nobody@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user account is disabled', async () => {
      const user = buildUser({ isActive: false });
      userRepository.findOneByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      await expect(
        service.signIn({ email: user.email, password: 'correct-password' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('returns new tokens when refresh token is valid', async () => {
      const user = buildUser();
      const payload: JwtPayload = { sub: user.id, roles: user.roles, refresh: true };
      jwtService.verifyAsync.mockResolvedValue(payload);
      userRepository.findOneById.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refresh('some-refresh-token');

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      expect(userRepository.findOneById).toHaveBeenCalledWith(user.id);
    });

    it('throws UnauthorizedException when payload.refresh is falsy', async () => {
      const payload: JwtPayload = { sub: 1, roles: [Role.User], refresh: false };
      jwtService.verifyAsync.mockResolvedValue(payload);

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOneById).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is not found', async () => {
      const payload: JwtPayload = { sub: 1, roles: [Role.User], refresh: true };
      jwtService.verifyAsync.mockResolvedValue(payload);
      userRepository.findOneById.mockResolvedValue(null);

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      const payload: JwtPayload = { sub: 1, roles: [Role.User], refresh: true };
      jwtService.verifyAsync.mockResolvedValue(payload);
      userRepository.findOneById.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rethrows as UnauthorizedException when jwtService.verifyAsync rejects', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOneById).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('decodes the token, blacklists it with the correct expiry, and returns a success message', async () => {
      const expSeconds = 1700000000;
      jwtService.decode.mockReturnValue({
        sub: 1,
        roles: [Role.User],
        exp: expSeconds,
      } as JwtPayload);
      blacklistRepository.save.mockResolvedValue(undefined);

      const result = await service.logout('some-token');

      expect(jwtService.decode).toHaveBeenCalledWith('some-token');
      expect(blacklistRepository.save).toHaveBeenCalledWith(
        'some-token',
        new Date(expSeconds * 1000),
      );
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('uses epoch (0) as expiry when the decoded token has no exp claim', async () => {
      jwtService.decode.mockReturnValue({ sub: 1, roles: [Role.User] } as JwtPayload);
      blacklistRepository.save.mockResolvedValue(undefined);

      await service.logout('token-without-exp');

      expect(blacklistRepository.save).toHaveBeenCalledWith(
        'token-without-exp',
        new Date(0),
      );
    });
  });
});
