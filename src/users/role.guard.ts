import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/rôles.decorator';
import { Role, RoleHierarchy } from '../common/enum/roles.enum';
import { ErrorMessage } from '../common/enum/error.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    this.validateUser(user, requiredRoles);
    return true;
  }

  private validateUser(user: any, requiredRoles: Role[]): void {
    if (!user) {
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED_MESSAGE);
    }

    if (!user.roles?.length) {
      throw new ForbiddenException(ErrorMessage.UNAUTHORIZED_MESSAGE);
    }

    const highestUserRoleLevel = Math.max(
      ...user.roles.map((role: Role) => RoleHierarchy[role]),
    );
    const minimumRequiredRoleLevel = Math.min(
      ...requiredRoles.map((role: Role) => RoleHierarchy[role]),
    );

    if (highestUserRoleLevel < minimumRequiredRoleLevel) {
      throw new ForbiddenException(ErrorMessage.UNAUTHORIZED_MESSAGE);
    }
  }
}
