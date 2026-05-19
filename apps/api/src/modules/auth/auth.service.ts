import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import type { LoginDto } from './dto/login.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_POOL) private db: Pool,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
  ) {}

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const result = await this.db.query(
      `SELECT id, email, password_hash, role, agency_id, is_active, full_name
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [dto.email],
    );

    const user = result.rows[0];
    if (!user) throw new UnauthorizedException('Неверный email или пароль');
    if (!user.is_active) throw new UnauthorizedException('Аккаунт деактивирован');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Неверный email или пароль');

    const tokens = await this.generateTokens(user, ip, userAgent);

    await this.auditLog.log({
      actor_id: user.id,
      action_type: AuditAction.LOGIN,
      target_type: 'user',
      target_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return { ...tokens, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } };
  }

  async refresh(rawToken: string, ip: string, userAgent: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const result = await this.db.query(
      `SELECT rt.*, u.email, u.role, u.agency_id, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.expires_at > NOW()
         AND rt.revoked_at IS NULL`,
      [tokenHash],
    );

    if (!result.rows[0]) throw new UnauthorizedException('Недействительный токен обновления');
    const { user_id, email, role, agency_id, is_active } = result.rows[0];
    if (!is_active) throw new UnauthorizedException('Аккаунт деактивирован');

    // Revoke used refresh token (rotation)
    await this.db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash],
    );

    return this.generateTokens({ id: user_id, email, role, agency_id }, ip, userAgent);
  }

  async logout(rawToken: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash],
    );
    return { success: true };
  }

  private async generateTokens(
    user: { id: string; email: string; role: string; agency_id: string | null },
    ip: string,
    userAgent: string,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      agency_id: user.agency_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const rawRefresh = randomBytes(64).toString('hex');
    const refreshHash = createHash('sha256').update(rawRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshHash, expiresAt, ip, userAgent],
    );

    return { access_token: accessToken, refresh_token: rawRefresh };
  }
}
