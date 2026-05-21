import { Injectable } from '@nestjs/common';
import { InjectDb } from '@crm/shared-core';
import type { Pool } from 'pg';

export interface CreateTaskDto {
  title: string;
  description?: string;
  due_at: string;
  priority: string;
  assigned_to?: string;
  demand_id?: string;
  property_id?: string;
  complex_id?: string;
  deal_id?: string;
}

export type UpdateTaskDto = Partial<CreateTaskDto & { status: string }>;

export interface TaskFilter {
  status?: string;
  priority?: string;
  due_before?: string;
  entity_type?: string;
  entity_id?: string;
  property_id?: string;
  demand_id?: string;
  complex_id?: string;
  agent_id?: string;
  assigned_to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TasksService {
  constructor(@InjectDb() private db: Pool) {}

  async findAll(filter: TaskFilter = {}) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (filter.status) {
      conditions.push(`t.status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.priority) {
      conditions.push(`t.priority = $${i++}`);
      params.push(filter.priority);
    }
    if (filter.due_before) {
      conditions.push(`t.due_at <= $${i++}`);
      params.push(filter.due_before);
    }
    if (filter.agent_id) {
      conditions.push(`t.agent_id = $${i++}`);
      params.push(filter.agent_id);
    }
    if (filter.assigned_to) {
      conditions.push(`t.assigned_to = $${i++}`);
      params.push(filter.assigned_to);
    }
    if (filter.property_id) {
      conditions.push(`t.property_id = $${i++}`);
      params.push(filter.property_id);
    } else if (filter.entity_type === 'property' && filter.entity_id) {
      conditions.push(`t.property_id = $${i++}`);
      params.push(filter.entity_id);
    } else if (filter.entity_type === 'demand' && filter.entity_id) {
      conditions.push(`t.demand_id = $${i++}`);
      params.push(filter.entity_id);
    } else if (filter.entity_type === 'complex' && filter.entity_id) {
      conditions.push(`t.complex_id = $${i++}`);
      params.push(filter.entity_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 50;
    const offset = ((filter.page ?? 1) - 1) * limit;

    const result = await this.db.query(
      `SELECT t.*,
              a.full_name AS agent_name,
              u.full_name AS assigned_name
       FROM tasks t
       LEFT JOIN users a ON a.id = t.agent_id
       LEFT JOIN users u ON u.id = t.assigned_to
       ${where}
       ORDER BY t.due_at ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    return result.rows;
  }

  async findOne(id: string) {
    const [taskResult, commentsResult] = await Promise.all([
      this.db.query(
        `SELECT t.*,
                a.full_name AS agent_name,
                u.full_name AS assigned_name
         FROM tasks t
         LEFT JOIN users a ON a.id = t.agent_id
         LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.id = $1`,
        [id],
      ),
      this.db.query(
        `SELECT tc.*, u.full_name AS author_name
         FROM task_comments tc
         JOIN users u ON u.id = tc.author_id
         WHERE tc.task_id = $1
         ORDER BY tc.created_at ASC`,
        [id],
      ),
    ]);

    const task = taskResult.rows[0];
    if (!task) return null;
    return { ...task, comments: commentsResult.rows };
  }

  async create(dto: CreateTaskDto, actorId: string) {
    const result = await this.db.query(
      `INSERT INTO tasks
         (title, description, due_at, priority, agent_id, assigned_to,
          demand_id, property_id, complex_id, deal_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        dto.title,
        dto.description ?? null,
        dto.due_at,
        dto.priority,
        actorId,
        dto.assigned_to ?? null,
        dto.demand_id ?? null,
        dto.property_id ?? null,
        dto.complex_id ?? null,
        dto.deal_id ?? null,
      ],
    );
    const task = result.rows[0] as Record<string, unknown>;

    this.db.query(
      `INSERT INTO entity_events (entity_type, entity_id, actor_id, event_type, payload)
       VALUES ('task', $1, $2, 'created', $3)`,
      [task['id'], actorId, JSON.stringify({ title: dto.title })],
    ).catch(() => null);

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const updatable = [
      'title', 'description', 'due_at', 'priority', 'status',
      'assigned_to', 'demand_id', 'property_id', 'complex_id', 'deal_id',
    ];

    let oldStatus: string | undefined;
    if (dto.status !== undefined) {
      const current = await this.db.query('SELECT status, agent_id FROM tasks WHERE id = $1', [id]);
      oldStatus = current.rows[0]?.status as string | undefined;
    }

    for (const key of updatable) {
      if ((dto as Record<string, unknown>)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push((dto as Record<string, unknown>)[key]);
      }
    }

    if (!fields.length) return this.findOne(id);
    params.push(id);

    const result = await this.db.query(
      `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      params,
    );

    const task = result.rows[0] as Record<string, unknown>;

    if (dto.status !== undefined && dto.status !== oldStatus) {
      this.db.query(
        `INSERT INTO entity_events (entity_type, entity_id, actor_id, event_type, payload)
         VALUES ('task', $1, $2, 'status_changed', $3)`,
        [id, task['agent_id'], JSON.stringify({ from: oldStatus, to: dto.status })],
      ).catch(() => null);
    }

    return task;
  }

  async delete(id: string, actorId: string) {
    const current = await this.db.query('SELECT title FROM tasks WHERE id = $1', [id]);
    await this.db.query('DELETE FROM tasks WHERE id = $1', [id]);

    this.db.query(
      `INSERT INTO entity_events (entity_type, entity_id, actor_id, event_type, payload)
       VALUES ('task', $1, $2, 'deleted', $3)`,
      [id, actorId, JSON.stringify({ title: current.rows[0]?.title })],
    ).catch(() => null);

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

  async addComment(taskId: string, body: string, actorId: string) {
    const result = await this.db.query(
      `INSERT INTO task_comments (task_id, author_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [taskId, actorId, body],
    );
    return result.rows[0];
  }

  async markOverdueTasks() {
    const result = await this.db.query(
      `UPDATE tasks SET status = 'overdue', updated_at = NOW()
       WHERE due_at < NOW()
         AND status NOT IN ('done', 'cancelled', 'overdue')
       RETURNING id`,
    );
    return { updated: result.rowCount ?? 0 };
  }
}
