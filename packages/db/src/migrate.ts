import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url, { ssl: 'require', max: 1 });
const db = drizzle(sql);

await migrate(db, { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
console.log('Migrations applied successfully');
await sql.end();
