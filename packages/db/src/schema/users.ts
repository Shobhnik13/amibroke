import { pgTable, uuid, integer, text, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { daemonStatusEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: integer('github_id').unique().notNull(),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url'),
  email: text('email'),
  isPublic: boolean('is_public').default(true).notNull(),
  apiKeyHash: text('api_key_hash').unique(),
  apiKeyPrefix: text('api_key_prefix'),
  daemonStatus: daemonStatusEnum('daemon_status'),
  lastSyncAt: timestamp('last_sync_at'),
  detectedAgents: json('detected_agents').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
