import { getDb } from './client';
import { users, usageRecords, syncLogs } from './index';
import { createHash, randomBytes } from 'crypto';

function generateRawKey(): string {
  return `amibroke_${randomBytes(32).toString('hex')}`;
}
function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
function extractPrefix(raw: string): string {
  return raw.slice(0, 16);
}

async function seed() {
  const db = getDb();
  await db.delete(syncLogs);
  await db.delete(usageRecords);
  await db.delete(users);
  console.log('Cleared existing data');
  const rawKey = generateRawKey();

  const [user] = await db
    .insert(users)
    .values({
      githubId: 99999999,
      username: 'testuser',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99999999',
      email: 'test@amibroke.dev',
      isPublic: true,
      apiKeyHash: hashKey(rawKey),
      apiKeyPrefix: extractPrefix(rawKey),
    })
    .onConflictDoUpdate({
      target: users.githubId,
      set: {
        apiKeyHash: hashKey(rawKey),
        apiKeyPrefix: extractPrefix(rawKey),
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`User: @${user.username} (${user.id})`);
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('API key:');
  console.log('');
  console.log(rawKey);
  console.log('─────────────────────────────────────────');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
