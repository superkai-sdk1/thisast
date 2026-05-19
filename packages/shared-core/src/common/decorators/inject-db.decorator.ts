import { Inject } from '@nestjs/common';
import { DB_POOL } from '../../database/database.module.js';

export const InjectDb = () => Inject(DB_POOL);
