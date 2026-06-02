import { eq } from 'drizzle-orm';
import { getDb, users } from '@amibroke/db';
import type { User } from '@amibroke/db';

export async function findUserById(id: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user ?? null;
}

export async function upsertUserByGithub(data: {
  githubId: number;
  username: string;
  avatarUrl: string;
  email: string | null;
}): Promise<User> {
  const db = getDb();
  const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.githubId,
      set: {
        username: data.username,
        avatarUrl: data.avatarUrl,
        email: data.email,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

export async function findUserByApiKeyHash(hash: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.apiKeyHash, hash)).limit(1);
  return user ?? null;
}

export async function saveApiKey(userId: string, hash: string, prefix: string): Promise<void> {
  const db = getDb();
  await db.update(users).set({ apiKeyHash: hash, apiKeyPrefix: prefix, updatedAt: new Date() }).where(eq(users.id, userId));
}


export async function updateDaemonStatus(
  userId: string,
  status: 'active' | 'stopped' | 'uninstalled',
  lastSyncAt?: Date,
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      daemonStatus: status,
      lastSyncAt: lastSyncAt ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

