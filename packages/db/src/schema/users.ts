import { pgTable, uuid, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { daemonStatusEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: integer('github_id').unique().notNull(),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url'),
  email: text('email'),
  isPublic: boolean('is_public').default(true).notNull(),
  daemonStatus: daemonStatusEnum('daemon_status'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
