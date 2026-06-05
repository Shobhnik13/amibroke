import { pgEnum } from 'drizzle-orm/pg-core';

export const agentEnum = pgEnum('agent', ['claude_code', 'opencode', 'codex']);
export const daemonStatusEnum = pgEnum('daemon_status', ['active', 'stopped', 'uninstalled']);
