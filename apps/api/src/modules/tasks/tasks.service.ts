import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import type { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DB_POOL) private db: Pool,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(actor: JwtPayload, filters: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    demand_id?: string;
    property_id?: string;
    complex_id?: string;
    deal_id?: string;
    due_before?: string;
    due_after?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['($1::boolean OR (t.agent_id = $2 OR t.assigned_to = $2))'];
    const params: unknown[] = [isAdmin, actor.sub];
    let idx = 3;

    if (filters.status) {
      conditions.push(`t.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.priority) {
      conditions.push(`t.priority = $${idx++}`);
      params.push(filters.priority);
    }
    if (filters.assigned_to) {
      conditions.push(`t.assigned_to = $${idx++}`);
      params.push(filters.assigned_to);
    }
    if (filters.demand_id) {
      conditions.push(`t.demand_id = $${idx++}`);
      params.push(filters.demand_id);
    }
    if (filters.property_id) {
      conditions.push(`t.property_id = $${idx++}`);
      params.push(filters.property_id);
    }
    if (filters.complex_id) {
      conditions.push(`t.complex_id = $${idx++}`);
      params.push(filters.complex_id);
    }
    if (filters.deal_id) {
      conditions.push(`t.deal_id = $${idx++}`);
      params.push(filters.deal_id);
    }
    if (filters.due_before) {
      conditions.push(`t.due_at <= $${idx++}`);
      params.push(filters.due_before);
    }
    if (filters.due_after) {
      conditions.push(`t.due_at >= $${idx++}`);
      params.push(filters.due_after);
    }

    params.push(limit, offset);
    const limitIdx = idx;
    const offsetIdx = idx + 1;

    const sql = `
      SELECT
        t.*,
        creator.full_name   AS agent_name,
        assignee.full_name  AS assigned_to_name,
        d.buyer_name        AS demand_name,
        p.district          AS property_address,
        rc.name             AS complex_name
      FROM tasks t
      JOIN users creator   ON creator.id = t.agent_id
      LEFT JOIN users assignee ON assignee.id = t.assigned_to
      LEFT JOIN demands d       ON d.id = t.demand_id
      LEFT JOIN properties p    ON p.id = t.property_id
      LEFT JOIN residential_complexes rc ON rc.id = t.complex_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        CASE t.status
          WHEN 'overdue'    THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'new'        THEN 3
          WHEN 'waiting'    THEN 4
          WHEN 'done'       THEN 5
          WHEN 'cancelled'  THEN 6
          ELSE 7
        END,
        CASE t.priority
          WHEN 'urgent' THEN 1
          WHEN 'high'   THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low'    THEN 4
          ELSE 5
        END,
        t.due_at ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async findOne(id: string, actor: JwtPayload) {
    const result = await this.db.query(
      `SELECT
         t.*,
         creator.full_name  AS agent_name,
         assignee.full_name AS assigned_to_name,
         d.buyer_name       AS demand_name,
         p.district         AS property_address,
         rc.name            AS complex_name
       FROM tasks t
       JOIN users creator   ON creator.id = t.agent_id
       LEFT JOIN users assignee ON assignee.id = t.assigned_to
       LEFT JOIN demands d       ON d.id = t.demand_id
       LEFT JOIN properties p    ON p.id = t.property_id
       LEFT JOIN residential_complexes rc ON rc.id = t.complex_id
       WHERE t.id = $1`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Задача не найдена');
    const task = result.rows[0];
    const isAdmin = [Role.ADMIN, Role.SUPERADMIN].includes(actor.role as Role);
    if (!isAdmin && task.agent_id !== actor.sub && task.assigned_to !== actor.sub) {
      throw new ForbiddenException('Нет доступа к этой задаче');
    }
    return task;
  }

  async create(dto: CreateTaskDto, actor: JwtPayload) {
    const result = await this.db.query(
      `INSERT INTO tasks (
         agent_id, assigned_to, title, description, due_at,
         priority, status,
         demand_id, property_id, complex_id, deal_id
       ) VALUES ($1,$2,$3,$4,$5,$6,'new',$7,$8,$9,$10)
       RETURNING *`,
      [
        actor.sub,
        dto.assigned_to ?? null,
        dto.title,
        dto.description ?? null,
        dto.due_at,
        dto.priority ?? 'medium',
        dto.demand_id   ?? null,
        dto.property_id ?? null,
        dto.complex_id  ?? null,
        dto.deal_id     ?? null,
      ],
    );
    const task = result.rows[0];

    await this.writeEvent(task.id, 'task', 'created', actor.sub, `Создана задача: ${task.title}`);

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, actor: JwtPayload) {
    const existing = await this.findOne(id, actor);

    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const scalar = ['title', 'description', 'due_at', 'priority', 'demand_id',
                    'property_id', 'complex_id', 'deal_id', 'assigned_to'] as const;

    for (const key of scalar) {
      if ((dto as Record<string, unknown>)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push((dto as Record<string, unknown>)[key]);
      }
    }

    if (dto.status !== undefined) {
      fields.push(`status = $${idx++}`);
      params.push(dto.status);
      if (dto.status === 'done') {
        fields.push(`completed_at = $${idx++}`);
        params.push(new Date().toISOString());
      }
    }

    if (!fields.length) return existing;
    params.push(id);

    const result = await this.db.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );

    if (dto.status && dto.status !== existing.status) {
      await this.writeEvent(id, 'task', 'status_changed', actor.sub,
        `Статус: ${existing.status} → ${dto.status}`);
    } else if (fields.length) {
      await this.writeEvent(id, 'task', 'updated', actor.sub, 'Задача обновлена');
    }

    return result.rows[0];
  }

  async delete(id: string, actor: JwtPayload) {
    await this.findOne(id, actor);
    await this.writeEvent(id, 'task', 'deleted', actor.sub, 'Задача удалена');
    await this.db.query('DELETE FROM tasks WHERE id = $1', [id]);
    return { success: true };
  }

  async getComments(taskId: string) {
    const result = await this.db.query(
      `SELECT tc.*, u.full_name AS author_name
       FROM task_comments tc
       JOIN users u ON u.id = tc.author_id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [taskId],
    );
    return result.rows;
  }

  async addComment(taskId: string, body: string, actor: JwtPayload) {
    await this.findOne(taskId, actor);
    const result = await this.db.query(
      `INSERT INTO task_comments (task_id, author_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [taskId, actor.sub, body],
    );
    await this.writeEvent(taskId, 'task', 'comment_added', actor.sub, body.substring(0, 100));
    return result.rows[0];
  }

  // Called by cron — mark overdue tasks
  async markOverdueTasks() {
    const result = await this.db.query(
      `UPDATE tasks
       SET status = 'overdue'
       WHERE status IN ('new', 'in_progress', 'waiting')
         AND due_at < NOW()
       RETURNING id, agent_id, assigned_to, title`,
    );
    return result.rows;
  }

  // Called by cron — send reminders
  async sendDueReminders() {
    // 24h ahead
    const in24h = await this.db.query(
      `SELECT t.*, u.id AS notify_user_id
       FROM tasks t
       JOIN users u ON u.id = COALESCE(t.assigned_to, t.agent_id)
       WHERE t.status IN ('new', 'in_progress', 'waiting')
         AND t.due_at BETWEEN NOW() + INTERVAL '23 hours 50 minutes'
                          AND NOW() + INTERVAL '24 hours 10 minutes'`,
    );
    for (const task of in24h.rows) {
      await this.notificationsService.create({
        user_id: task.notify_user_id,
        title: 'Задача через 24 часа',
        body: task.title,
        type: 'task_due',
        payload: { task_id: task.id },
      }).catch(() => null);
    }

    // 1h ahead
    const in1h = await this.db.query(
      `SELECT t.*, u.id AS notify_user_id
       FROM tasks t
       JOIN users u ON u.id = COALESCE(t.assigned_to, t.agent_id)
       WHERE t.status IN ('new', 'in_progress', 'waiting')
         AND t.due_at BETWEEN NOW() + INTERVAL '50 minutes'
                          AND NOW() + INTERVAL '70 minutes'`,
    );
    for (const task of in1h.rows) {
      await this.notificationsService.create({
        user_id: task.notify_user_id,
        title: 'Задача через 1 час',
        body: task.title,
        type: 'task_due',
        payload: { task_id: task.id },
      }).catch(() => null);
    }
  }

  private async writeEvent(
    entityId: string,
    entityType: string,
    eventType: string,
    userId: string,
    description: string,
    oldValue?: string,
    newValue?: string,
  ) {
    await this.db.query(
      `INSERT INTO entity_events (entity_type, entity_id, event_type, user_id, description, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [entityType, entityId, eventType, userId, description, oldValue ?? null, newValue ?? null],
    ).catch(() => null);
  }
}
