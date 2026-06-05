import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as enumsSchema from './schema/enums';
import * as usersSchema from './schema/users';
import * as usageRecordsSchema from './schema/usage-records';
import * as syncLogsSchema from './schema/sync-logs';

const schema = {
  ...enumsSchema,
  ...usersSchema,
  ...usageRecordsSchema,
  ...syncLogsSchema,
};

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = postgres(url, { ssl: 'require', max: 10 });
  _db = drizzle(sql, { schema });
  return _db;
}

export type DB = ReturnType<typeof getDb>;
