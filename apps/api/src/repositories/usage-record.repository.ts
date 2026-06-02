import { eq, sum, desc, sql } from 'drizzle-orm';
import { getDb, usageRecords, users } from '@amibroke/db';
import type { SyncRecord } from '../services/sync.service';

const BATCH_SIZE = 200;

export async function batchUpsertRecords(userId: string, records: SyncRecord[]): Promise<number> {
  const db = getDb();

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    await db
      .insert(usageRecords)
      .values(
        chunk.map((r) => ({
          userId,
          agent: r.agent,
          date: r.date,
          model: r.model,
          inputTokens: r.input_tokens,
          outputTokens: r.output_tokens,
          cacheReadTokens: r.cache_read_tokens,
          cacheWriteTokens: r.cache_write_tokens,
          costUsd: r.cost_usd,
        }))
      )
      .onConflictDoUpdate({
        target: [usageRecords.userId, usageRecords.agent, usageRecords.date, usageRecords.model],
        set: {
          inputTokens: sql`EXCLUDED.input_tokens`,
          outputTokens: sql`EXCLUDED.output_tokens`,
          cacheReadTokens: sql`EXCLUDED.cache_read_tokens`,
          cacheWriteTokens: sql`EXCLUDED.cache_write_tokens`,
          costUsd: sql`EXCLUDED.cost_usd`,
          updatedAt: new Date(),
        },
      });
  }

  return records.length;
}

export async function sumCostByUserId(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ total: sum(usageRecords.costUsd) })
    .from(usageRecords)
    .where(eq(usageRecords.userId, userId));
  return row?.total ?? '0';
}

export async function getLeaderboard(limit: number, offset: number) {
  const db = getDb();
  const totalCost = sql<string>`sum(${usageRecords.costUsd})`.as('total_cost_usd');
  return db
    .select({
      username: users.username,
      avatarUrl: users.avatarUrl,
      totalCostUsd: totalCost,
    })
    .from(usageRecords)
    .innerJoin(users, eq(usageRecords.userId, users.id))
    .where(eq(users.isPublic, true))
    .groupBy(users.username, users.avatarUrl)
    .orderBy(desc(totalCost))
    .limit(limit)
    .offset(offset);
}

export async function getUserBreakdown(userId: string) {
  const db = getDb();
  return db
    .select({
      agent: usageRecords.agent,
      model: usageRecords.model,
      totalInputTokens: sum(usageRecords.inputTokens),
      totalOutputTokens: sum(usageRecords.outputTokens),
      totalCostUsd: sum(usageRecords.costUsd),
    })
    .from(usageRecords)
    .where(eq(usageRecords.userId, userId))
    .groupBy(usageRecords.agent, usageRecords.model)
    .orderBy(desc(sum(usageRecords.costUsd)));
}
