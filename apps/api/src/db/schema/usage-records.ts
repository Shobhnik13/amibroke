import { pgTable, uuid, date, text, integer, numeric, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { agentEnum } from './enums';
import { users } from './users';

export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agent: agentEnum('agent').notNull(),
  date: date('date').notNull(),
  model: text('model').default('unknown').notNull(),
  inputTokens: integer('input_tokens').default(0).notNull(),
  outputTokens: integer('output_tokens').default(0).notNull(),
  cacheReadTokens: integer('cache_read_tokens').default(0).notNull(),
  cacheWriteTokens: integer('cache_write_tokens').default(0).notNull(),
  costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique('uq_usage_record').on(t.userId, t.agent, t.date, t.model),
  index('idx_usage_user_date').on(t.userId, t.date),
]);

export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
