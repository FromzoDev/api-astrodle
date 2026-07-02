import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './rôles.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../users/role.guard';
import { Role } from '../enum/roles.enum';

export const Auth = (...roles: Role[]) =>
  applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard),
  );