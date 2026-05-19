import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { JwtPayload } from '@crm/shared-core';

export const IS_PUBLIC = 'isPublic';
export const Public = () => (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata(IS_PUBLIC, true, descriptor.value);
    return descriptor;
  }
  Reflect.defineMetadata(IS_PUBLIC, true, target);
};

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException();

    try {
      req.user = this.jwt.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return undefined;
  }
}
