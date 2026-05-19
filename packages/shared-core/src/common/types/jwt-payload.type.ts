export interface JwtPayload {
  sub:       string;   // user id
  email:     string;
  role:      string;
  agencyId:  string;
  permission_flags: Record<string, boolean>;
  iat?: number;
  exp?: number;
}
