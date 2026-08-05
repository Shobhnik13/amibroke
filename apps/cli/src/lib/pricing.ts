// All rates per 1M tokens in USD
// Source: https://anthropic.com/pricing
// cacheWrite uses 5-minute write rate (1.25x base input)

const RATES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  // Claude Fable 5 / Mythos 5 ($10 input, $50 output)
  'claude-fable-5':    { input: 10.00, output: 50.00, cacheRead: 1.00,  cacheWrite: 12.50 },
  'claude-mythos-5':   { input: 10.00, output: 50.00, cacheRead: 1.00,  cacheWrite: 12.50 },

  // Claude Opus 5 ($5 input, $25 output)
  'claude-opus-5':     { input: 5.00,  output: 25.00, cacheRead: 0.50,  cacheWrite: 6.25  },

  // Claude Sonnet 5 ($3 input, $15 output; intro $2/$10 through 2026-08-31)
  'claude-sonnet-5':   { input: 3.00,  output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75  },

  // Claude Opus 4.x ($5 input, $25 output)
  'claude-opus-4-8':   { input: 5.00,  output: 25.00, cacheRead: 0.50,  cacheWrite: 6.25  },
  'claude-opus-4-7':   { input: 5.00,  output: 25.00, cacheRead: 0.50,  cacheWrite: 6.25  },
  'claude-opus-4-6':   { input: 5.00,  output: 25.00, cacheRead: 0.50,  cacheWrite: 6.25  },
  'claude-opus-4-5':   { input: 5.00,  output: 25.00, cacheRead: 0.50,  cacheWrite: 6.25  },

  // Claude Opus 4.1 / legacy ($15 input, $75 output)
  'claude-opus-4-1':   { input: 15.00, output: 75.00, cacheRead: 1.50,  cacheWrite: 18.75 },
  'claude-opus-4-0':   { input: 15.00, output: 75.00, cacheRead: 1.50,  cacheWrite: 18.75 },

  // Claude Sonnet 4.x ($3 input, $15 output)
  'claude-sonnet-4-6': { input: 3.00,  output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75  },
  'claude-sonnet-4-5': { input: 3.00,  output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75  },
  'claude-sonnet-4-0': { input: 3.00,  output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75  },

  // Claude Haiku 4.5 ($1 input, $5 output)
  'claude-haiku-4-5':  { input: 1.00,  output: 5.00,  cacheRead: 0.10,  cacheWrite: 1.25  },

  // Claude Haiku 3.5 ($0.80 input, $4 output)
  'claude-haiku-3-5':  { input: 0.80,  output: 4.00,  cacheRead: 0.08,  cacheWrite: 1.00  },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00, cacheRead: 0.08, cacheWrite: 1.00 },

  // Legacy Claude 3 models
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3-opus-20240229':     { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },

  // OpenAI (source: developers.openai.com/api/docs/pricing)
  // GPT-5.6 family — 1.05M context. Requests over 272K input tokens bill at 2x input / 1.5x output.
  'gpt-5.6-sol':     { input: 5.00,  output: 30.00, cacheRead: 0.50,  cacheWrite: 0.00 },
  'gpt-5.6-terra':   { input: 2.00,  output: 12.00, cacheRead: 0.20,  cacheWrite: 0.00 },
  'gpt-5.6-luna':    { input: 0.20,  output: 1.20,  cacheRead: 0.02,  cacheWrite: 0.00 },

  'gpt-5.5':         { input: 5.00,  output: 30.00, cacheRead: 0.50,  cacheWrite: 0.00 },
  'gpt-5.5-pro':     { input: 30.00, output: 180.00, cacheRead: 0.00, cacheWrite: 0.00 },
  'gpt-5.4':         { input: 2.50,  output: 15.00, cacheRead: 0.25,  cacheWrite: 0.00 },
  'gpt-5.4-mini':    { input: 0.75,  output: 4.50,  cacheRead: 0.075, cacheWrite: 0.00 },
  'gpt-5.4-nano':    { input: 0.20,  output: 1.25,  cacheRead: 0.02,  cacheWrite: 0.00 },
  'gpt-5.3-codex':   { input: 1.75,  output: 14.00, cacheRead: 0.175, cacheWrite: 0.00 },
  // Legacy OpenAI models
  'gpt-4o':          { input: 2.50,  output: 10.00, cacheRead: 1.25,  cacheWrite: 0.00 },
  'gpt-4o-mini':     { input: 0.15,  output: 0.60,  cacheRead: 0.075, cacheWrite: 0.00 },
  'o3':              { input: 10.00, output: 40.00, cacheRead: 2.50,  cacheWrite: 0.00 },
  'o4-mini':         { input: 1.10,  output: 4.40,  cacheRead: 0.275, cacheWrite: 0.00 },

  // Google Gemini (source: ai.google.dev/pricing)
  'gemini-2.5-pro':          { input: 1.25,  output: 10.00, cacheRead: 0.31,  cacheWrite: 0.00 },
  'gemini-2.5-flash':        { input: 0.15,  output: 0.60,  cacheRead: 0.0375, cacheWrite: 0.00 },
  'gemini-2.5-flash-lite':   { input: 0.10,  output: 0.40,  cacheRead: 0.025,  cacheWrite: 0.00 },
  'gemini-2.0-flash':        { input: 0.10,  output: 0.40,  cacheRead: 0.025,  cacheWrite: 0.00 },
  'gemini-2.0-flash-lite':   { input: 0.075, output: 0.30,  cacheRead: 0.01875, cacheWrite: 0.00 },
  'gemini-1.5-pro':          { input: 1.25,  output: 5.00,  cacheRead: 0.3125, cacheWrite: 0.00 },
  'gemini-1.5-flash':        { input: 0.075, output: 0.30,  cacheRead: 0.01875, cacheWrite: 0.00 },

  // DeepSeek (source: api-docs.deepseek.com/quick_start/pricing)
  'deepseek-chat':      { input: 0.27,  output: 1.10,  cacheRead: 0.07,  cacheWrite: 0.00 },
  'deepseek-reasoner':  { input: 0.55,  output: 2.19,  cacheRead: 0.14,  cacheWrite: 0.00 },

  // Mistral (source: mistral.ai/pricing)
  'mistral-large-latest':   { input: 2.00, output: 6.00,  cacheRead: 0.00, cacheWrite: 0.00 },
  'mistral-medium-latest':  { input: 0.40, output: 2.00,  cacheRead: 0.00, cacheWrite: 0.00 },
  'mistral-small-latest':   { input: 0.10, output: 0.30,  cacheRead: 0.00, cacheWrite: 0.00 },
  'codestral-latest':       { input: 0.20, output: 0.60,  cacheRead: 0.00, cacheWrite: 0.00 },
  'ministral-8b-latest':    { input: 0.10, output: 0.10,  cacheRead: 0.00, cacheWrite: 0.00 },
  'ministral-3b-latest':    { input: 0.04, output: 0.04,  cacheRead: 0.00, cacheWrite: 0.00 },

  // xAI Grok (source: x.ai/api)
  'grok-3':         { input: 3.00,  output: 15.00, cacheRead: 0.00, cacheWrite: 0.00 },
  'grok-3-fast':    { input: 0.60,  output: 4.00,  cacheRead: 0.00, cacheWrite: 0.00 },
  'grok-3-mini':    { input: 0.30,  output: 0.50,  cacheRead: 0.00, cacheWrite: 0.00 },
  'grok-2':         { input: 2.00,  output: 10.00, cacheRead: 0.00, cacheWrite: 0.00 },
  'grok-2-mini':    { input: 0.20,  output: 0.50,  cacheRead: 0.00, cacheWrite: 0.00 },

  // Alibaba Qwen (source: help.aliyun.com/qwen-api-pricing)
  'qwen-max':         { input: 1.60, output: 6.40,  cacheRead: 0.00, cacheWrite: 0.00 },
  'qwen-plus':        { input: 0.40, output: 1.20,  cacheRead: 0.00, cacheWrite: 0.00 },
  'qwen-turbo':       { input: 0.05, output: 0.20,  cacheRead: 0.00, cacheWrite: 0.00 },
  'qwen-long':        { input: 0.05, output: 0.20,  cacheRead: 0.00, cacheWrite: 0.00 },

  // Moonshot (Kimi) (source: platform.moonshot.cn/pricing)
  'moonshot-v1-8k':   { input: 0.12, output: 0.12,  cacheRead: 0.00, cacheWrite: 0.00 },
  'moonshot-v1-32k':  { input: 0.24, output: 0.24,  cacheRead: 0.00, cacheWrite: 0.00 },
  'moonshot-v1-128k': { input: 0.90, output: 0.90,  cacheRead: 0.00, cacheWrite: 0.00 },
  'kimi-k2':          { input: 0.60, output: 2.50,  cacheRead: 0.07, cacheWrite: 0.00 },

  // Zhipu GLM (source: bigmodel.cn/pricing)
  'glm-4':            { input: 0.14, output: 0.14,  cacheRead: 0.00, cacheWrite: 0.00 },
  'glm-4-flash':      { input: 0.00, output: 0.00,  cacheRead: 0.00, cacheWrite: 0.00 },
  'glm-4-plus':       { input: 0.70, output: 0.70,  cacheRead: 0.00, cacheWrite: 0.00 },
  'glm-z1':           { input: 0.14, output: 0.14,  cacheRead: 0.00, cacheWrite: 0.00 },
};

// Strip trailing date suffix e.g. claude-haiku-4-5-20251001 → claude-haiku-4-5
export function normalizeModel(model: string): string {
  return model.replace(/-\d{8}$/, '');
}

export function calcCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
): number {
  const r = RATES[normalizeModel(model)];
  if (!r) return 0;
  return (
    (inputTokens      / 1_000_000) * r.input +
    (outputTokens     / 1_000_000) * r.output +
    (cacheReadTokens  / 1_000_000) * r.cacheRead +
    (cacheWriteTokens / 1_000_000) * r.cacheWrite
  );
}
