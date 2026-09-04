import { Role } from '../enum/roles.enum';

export interface JwtPayload {
  sub: number;
  roles: Role[];
  refresh?: boolean;
  iat?: number;
  exp?: number;
}
