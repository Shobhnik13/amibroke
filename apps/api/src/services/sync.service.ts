import { findUserById, updateDaemonStatus } from '../repositories/user.repository';
import { batchUpsertRecords } from '../repositories/usage-record.repository';
import { insertSyncLog } from '../repositories/sync-log.repository';

export type SyncRecord = {
  agent: 'claude_code' | 'opencode' | 'codex';
  date: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: string;
};

export type SyncResult =
  | { ok: true; records_upserted: number }
  | { ok: false; error: string };

export async function processSync(
  userId: string,
  records: SyncRecord[],
  clientVersion?: string,
): Promise<SyncResult> {
  const user = await findUserById(userId);
  if (!user) return { ok: false, error: 'User not found' };

  const recordsUpserted = await batchUpsertRecords(userId, records);
  const agentsSynced = [...new Set(records.map((r) => r.agent))];

  await Promise.all([
    insertSyncLog({ userId, agentsSynced, recordsUpserted, clientVersion }),
    updateDaemonStatus(userId, 'active', new Date()),
  ]);

  return { ok: true, records_upserted: recordsUpserted };
}

export async function unregisterDaemon(
  userId: string,
  reason: 'stopped' | 'uninstalled',
): Promise<void> {
  await updateDaemonStatus(userId, reason);
}
