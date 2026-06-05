import { eq, desc } from 'drizzle-orm';
import { getDb, syncLogs } from '../db';
import type { SyncLog } from '../db';

export async function getLastSync(userId: string): Promise<SyncLog | null> {
  const db = getDb();
  const [log] = await db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.userId, userId))
    .orderBy(desc(syncLogs.syncedAt))
    .limit(1);
  return log ?? null;
}

export async function insertSyncLog(data: {
  userId: string;
  agentsSynced: string[];
  recordsUpserted: number;
  clientVersion?: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(syncLogs).values(data);
}
