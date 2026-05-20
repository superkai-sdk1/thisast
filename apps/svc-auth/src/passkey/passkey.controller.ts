import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_PASSKEY_REG_OPTIONS,
  MSG_PASSKEY_REG_VERIFY,
  MSG_PASSKEY_AUTH_OPTIONS,
  MSG_PASSKEY_AUTH_VERIFY,
} from '@crm/shared-types';
import { PasskeyService } from './passkey.service';

@Controller()
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @MessagePattern(MSG_PASSKEY_REG_OPTIONS)
  getRegOptions(@Payload() data: { userId: string }) {
    return this.passkeyService.getRegistrationOptions(data.userId);
  }

  @MessagePattern(MSG_PASSKEY_REG_VERIFY)
  verifyReg(
    @Payload() data: { userId: string; response: unknown; deviceName?: string },
  ) {
    return this.passkeyService.verifyRegistration(
      data.userId,
      data.response as never,
      data.deviceName,
    );
  }

  @MessagePattern(MSG_PASSKEY_AUTH_OPTIONS)
  getAuthOptions(@Payload() data: { email?: string }) {
    return this.passkeyService.getAuthenticationOptions(data.email);
  }

  @MessagePattern(MSG_PASSKEY_AUTH_VERIFY)
  verifyAuth(
    @Payload() data: { challengeKey: string; response: unknown; ip: string; userAgent: string },
  ) {
    return this.passkeyService.verifyAuthentication(
      data.challengeKey,
      data.response as never,
      data.ip,
      data.userAgent,
    );
  }

  @MessagePattern('passkey:list')
  list(@Payload() data: { userId: string }) {
    return this.passkeyService.listCredentials(data.userId);
  }

  @MessagePattern('passkey:delete')
  delete(@Payload() data: { credId: string; userId: string }) {
    return this.passkeyService.deleteCredential(data.credId, data.userId);
  }
}
