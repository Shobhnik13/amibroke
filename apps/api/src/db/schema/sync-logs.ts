import { pgTable, uuid, timestamp, text, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const syncLogs = pgTable('sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
  agentsSynced: text('agents_synced').array().notNull(),
  recordsUpserted: integer('records_upserted').default(0).notNull(),
  clientVersion: text('client_version'),
});

export type SyncLog = typeof syncLogs.$inferSelect;
