import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator.js';
import * as webpush from 'web-push';

export interface CreateNotificationDto {
  user_id: string;
  title: string;
  body?: string;
  type: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(DB_POOL) private db: Pool) {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL ?? 'admin@crm.local'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );
    }
  }

  async create(dto: CreateNotificationDto) {
    const result = await this.db.query(
      `INSERT INTO notifications (user_id, title, body, type, payload)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.user_id, dto.title, dto.body ?? null, dto.type, dto.payload ? JSON.stringify(dto.payload) : null],
    );
    const notification = result.rows[0];

    // Attempt web push
    await this.sendPush(dto.user_id, dto.title, dto.body ?? '', dto.payload).catch(console.error);

    return notification;
  }

  private async sendPush(userId: string, title: string, body: string, payload?: Record<string, unknown>) {
    const result = await this.db.query<{ push_subscription: webpush.PushSubscription | null }>(
      'SELECT push_subscription FROM users WHERE id = $1',
      [userId],
    );
    const subscription = result.rows[0]?.push_subscription;
    if (!subscription) return;

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, data: payload }),
    );

    await this.db.query(
      `UPDATE notifications SET sent_at = NOW() WHERE user_id = $1 AND sent_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
  }

  async findAll(userId: string, onlyUnread = false) {
    const result = await this.db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ${onlyUnread ? "AND is_read = false" : ""}
       ORDER BY created_at DESC LIMIT 50`,
      [userId],
    );
    return result.rows;
  }

  async markRead(id: string, userId: string) {
    await this.db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    return { success: true };
  }

  async savePushSubscription(userId: string, subscription: webpush.PushSubscription) {
    await this.db.query('UPDATE users SET push_subscription = $1 WHERE id = $2', [JSON.stringify(subscription), userId]);
    return { success: true };
  }
}
