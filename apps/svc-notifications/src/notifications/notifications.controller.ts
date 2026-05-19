import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import {
  MSG_NOTIF_LIST,
  MSG_NOTIF_MARK_READ,
  MSG_NOTIF_MARK_ALL,
  MSG_NOTIF_SUBSCRIBE,
  EVT_NOTIFICATION_SEND,
} from '@crm/shared-types';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern(MSG_NOTIF_LIST)
  async list(@Payload() data: { userId: string; onlyUnread?: boolean }) {
    return this.notificationsService.findAll(data.userId, data.onlyUnread);
  }

  @MessagePattern(MSG_NOTIF_MARK_READ)
  async markRead(@Payload() data: { id: string; userId: string }) {
    return this.notificationsService.markRead(data.id, data.userId);
  }

  @MessagePattern(MSG_NOTIF_MARK_ALL)
  async markAll(@Payload() data: { userId: string }) {
    return this.notificationsService.markAllRead(data.userId);
  }

  @MessagePattern(MSG_NOTIF_SUBSCRIBE)
  async subscribe(@Payload() data: { userId: string; subscription: any }) {
    return this.notificationsService.savePushSubscription(data.userId, data.subscription);
  }

  @EventPattern(EVT_NOTIFICATION_SEND)
  async onNotificationSend(@Payload() data: {
    user_id: string;
    title: string;
    body?: string;
    type: string;
    payload?: Record<string, unknown>;
  }) {
    await this.notificationsService.create(data);
  }
}
