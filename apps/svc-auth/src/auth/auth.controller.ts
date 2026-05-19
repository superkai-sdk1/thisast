import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_AUTH_LOGIN,
  MSG_AUTH_REFRESH,
  MSG_AUTH_LOGOUT,
  MSG_AUTH_VALIDATE,
} from '@crm/shared-types';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MSG_AUTH_LOGIN)
  login(@Payload() payload: { email: string; password: string; ip: string; userAgent: string }) {
    return this.authService.login(
      { email: payload.email, password: payload.password },
      payload.ip,
      payload.userAgent,
    );
  }

  @MessagePattern(MSG_AUTH_REFRESH)
  refresh(@Payload() payload: { refreshToken: string; ip: string; userAgent: string }) {
    return this.authService.refresh(payload.refreshToken, payload.ip, payload.userAgent);
  }

  @MessagePattern(MSG_AUTH_LOGOUT)
  logout(@Payload() payload: { refreshToken: string }) {
    return this.authService.logout(payload.refreshToken);
  }

  @MessagePattern(MSG_AUTH_VALIDATE)
  validate(@Payload() payload: { token: string }) {
    return this.authService.validate(payload.token);
  }
}
