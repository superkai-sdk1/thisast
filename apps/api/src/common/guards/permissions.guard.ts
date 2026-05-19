import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '../decorators/inject-connection.decorator';
import type { Pool } from 'pg';
import { PERMISSIONS_KEY, type PermissionFlag } from '../decorators/permissions.decorator';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectConnection() private db: Pool,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionFlag[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user as JwtPayload;

    const result = await this.db.query<{ permission_flags: Record<string, boolean> }>(
      'SELECT permission_flags FROM users WHERE id = $1 AND is_active = true',
      [user.sub],
    );

    if (!result.rows[0]) throw new ForbiddenException('Пользователь не найден');
    const flags = result.rows[0].permission_flags;

    for (const flag of required) {
      if (!flags[flag]) throw new ForbiddenException(`Требуется разрешение: ${flag}`);
    }
    return true;
  }
}
