import { eq, sum, desc, sql, and } from 'drizzle-orm';
import type { Period } from '../services/leaderboard.service';
import { getDb, usageRecords, users } from '../db';
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

function periodClause(period: Period) {
  if (period === 'daily')   return sql`${usageRecords.date} = current_date`;
  if (period === 'weekly')  return sql`${usageRecords.date} >= current_date - interval '6 days'`;
  if (period === 'monthly') return sql`${usageRecords.date} >= current_date - interval '29 days'`;
  return undefined; // all_time — no filter
}

export async function getLeaderboard(limit: number, offset: number, period: Period) {
  const db = getDb();
  const totalCostUsd       = sql<string>`sum(${usageRecords.costUsd})`.as('total_cost_usd');
  const totalInputTokens   = sql<string>`sum(${usageRecords.inputTokens})`.as('total_input_tokens');
  const totalOutputTokens  = sql<string>`sum(${usageRecords.outputTokens})`.as('total_output_tokens');
  const totalCacheRead     = sql<string>`sum(${usageRecords.cacheReadTokens})`.as('total_cache_read_tokens');
  const totalCacheWrite    = sql<string>`sum(${usageRecords.cacheWriteTokens})`.as('total_cache_write_tokens');
  return db
    .select({
      username: users.username,
      avatarUrl: users.avatarUrl,
      totalCostUsd,
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens: totalCacheRead,
      totalCacheWriteTokens: totalCacheWrite,
    })
    .from(usageRecords)
    .innerJoin(users, eq(usageRecords.userId, users.id))
    .where(and(eq(users.isPublic, true), periodClause(period)))
    .groupBy(users.username, users.avatarUrl)
    .orderBy(desc(totalCostUsd))
    .limit(limit)
    .offset(offset);
}

export async function getLeaderboardCount(period: Period): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<string>`count(distinct ${users.id})` })
    .from(usageRecords)
    .innerJoin(users, eq(usageRecords.userId, users.id))
    .where(and(eq(users.isPublic, true), periodClause(period)));
  return parseInt(row?.count ?? '0', 10);
}

export async function getUserBreakdown(userId: string, period: Period) {
  const db = getDb();
  return db
    .select({
      agent: usageRecords.agent,
      model: usageRecords.model,
      totalInputTokens:      sum(usageRecords.inputTokens),
      totalOutputTokens:     sum(usageRecords.outputTokens),
      totalCacheReadTokens:  sum(usageRecords.cacheReadTokens),
      totalCacheWriteTokens: sum(usageRecords.cacheWriteTokens),
      totalCostUsd:          sum(usageRecords.costUsd),
    })
    .from(usageRecords)
    .where(and(eq(usageRecords.userId, userId), periodClause(period)))
    .groupBy(usageRecords.agent, usageRecords.model)
    .orderBy(desc(sum(usageRecords.costUsd)));
}
