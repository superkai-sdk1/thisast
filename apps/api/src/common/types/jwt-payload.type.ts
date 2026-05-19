import type { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: Role;
  agency_id: string | null;
}

export interface JwtRefreshPayload extends JwtPayload {
  jti: string;        // refresh token id for revocation
}
