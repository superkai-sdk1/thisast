import { Inject } from '@nestjs/common';

export const DB_POOL = 'DB_POOL';
export const InjectConnection = () => Inject(DB_POOL);
