import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Pool } from 'pg';
import { DB_POOL } from '../../common/decorators/inject-connection.decorator';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto, UpdatePermissionsDto } from './dto/update-user.dto';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { Role } from '../../common/enums/role.enum';

const PUBLIC_FIELDS = `
  id, agency_id, email, role, full_name, phone, photo_url,
  permission_flags, is_active, created_at, updated_at
`;

@Injectable()
export class UsersService {
  constructor(@Inject(DB_POOL) private db: Pool) {}

  async findAll(agencyId?: string) {
    const result = await this.db.query(
      `SELECT ${PUBLIC_FIELDS} FROM users
       WHERE deleted_at IS NULL
         AND ($1::uuid IS NULL OR agency_id = $1)
       ORDER BY full_name`,
      [agencyId ?? null],
    );
    return result.rows;
  }

  async findOne(id: string) {
    const result = await this.db.query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Пользователь не найден');
    return result.rows[0];
  }

  async create(dto: CreateUserDto, actor: JwtPayload) {
    const existing = await this.db.query('SELECT id FROM users WHERE email = $1', [dto.email]);
    if (existing.rows[0]) throw new ConflictException('Email уже используется');

    const hash = await bcrypt.hash(dto.password, 12);
    const flags = {
      can_view_global_database: false,
      can_export_data: false,
      can_see_financials: false,
      can_delete_records: false,
      ...dto.permission_flags,
    };

    // Only superadmin can create admins
    const role = dto.role ?? Role.AGENT;
    if (role === Role.SUPERADMIN && actor.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Только суперадмин может создать суперадмина');
    }

    const result = await this.db.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, agency_id, permission_flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${PUBLIC_FIELDS}`,
      [dto.email, hash, role, dto.full_name, dto.phone ?? null, dto.agency_id ?? actor.agency_id, JSON.stringify(flags)],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    const result = await this.db.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone     = COALESCE($2, phone),
         is_active = COALESCE($3, is_active)
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING ${PUBLIC_FIELDS}`,
      [dto.full_name ?? null, dto.phone ?? null, dto.is_active ?? null, id],
    );
    return result.rows[0] ?? user;
  }

  async updatePermissions(id: string, dto: UpdatePermissionsDto) {
    await this.findOne(id);
    const result = await this.db.query(
      `UPDATE users SET permission_flags = $1 WHERE id = $2
       RETURNING ${PUBLIC_FIELDS}`,
      [JSON.stringify(dto.permission_flags), id],
    );
    return result.rows[0];
  }

  async updateAvatar(id: string, photoUrl: string) {
    const result = await this.db.query(
      `UPDATE users SET photo_url = $1 WHERE id = $2 RETURNING ${PUBLIC_FIELDS}`,
      [photoUrl, id],
    );
    return result.rows[0];
  }

  async softDelete(id: string) {
    await this.findOne(id);
    await this.db.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1',
      [id],
    );
    return { success: true };
  }
}
