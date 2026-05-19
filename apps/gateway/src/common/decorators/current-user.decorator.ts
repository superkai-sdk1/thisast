import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@crm/shared-core';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    return ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user;
  },
);
