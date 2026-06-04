export type Agent = 'claude_code' | 'opencode' | 'codex';

export type AggregateRecord = {
  agent: Agent;
  date: string;   // YYYY-MM-DD
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: string;
};

export type Cursors = {
  claude_code: Record<string, number>;  // file path → byte offset
  codex: Record<string, number>;        // file path → byte offset
  opencode: { last_timestamp: string }; // ISO timestamp
};

export type State = {
  cursors: Partial<Cursors>;
  last_sync_at: string | null;
};

export type Auth = {
  token: string;
  api_url: string;
  username: string;
};
