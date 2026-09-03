import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../../src/users/users.repository';
import { Role } from '../../src/common/enum/roles.enum';
import { User } from '../../src/users/user.entity';

let userCounter = 0;

export const DEFAULT_TEST_PASSWORD = 'Password123!';

export interface CreateUserOptions {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  isActive?: boolean;
  roles?: Role[];
}

export async function createUser(
  app: INestApplication,
  options: CreateUserOptions = {},
): Promise<User> {
  const usersRepository = app.get(UsersRepository);
  userCounter += 1;
  const uniqueSuffix = `${Date.now()}_${userCounter}`;

  const hashedPassword = await bcrypt.hash(
    options.password ?? DEFAULT_TEST_PASSWORD,
    10,
  );

  return usersRepository.createUser({
    email: options.email ?? `user_${uniqueSuffix}@test.com`,
    username: options.username ?? `user_${uniqueSuffix}`,
    firstName: options.firstName ?? 'Test',
    lastName: options.lastName ?? 'User',
    password: hashedPassword,
    isActive: options.isActive ?? true,
    roles: options.roles ?? [Role.User],
  });
}

export function signAccessToken(app: INestApplication, user: User): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign(
    { sub: user.id, roles: user.roles },
    { expiresIn: '15m' },
  );
}

export function signRefreshToken(app: INestApplication, user: User): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign(
    { sub: user.id, roles: user.roles, refresh: true },
    { expiresIn: '7d' },
  );
}

export interface AuthenticatedUser {
  user: User;
  token: string;
}

export async function createAuthenticatedUser(
  app: INestApplication,
  roles: Role[] = [Role.User],
  options: CreateUserOptions = {},
): Promise<AuthenticatedUser> {
  const user = await createUser(app, { ...options, roles });
  return { user, token: signAccessToken(app, user) };
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
