import type { Agent, AggregateRecord } from '../types';

export type AggMap = Map<string, AggregateRecord>;

export function createAggMap(): AggMap {
  return new Map();
}

export function addToAgg(
  map: AggMap,
  agent: Agent,
  date: string,
  model: string,
  tokens: {
    input: number;
    output: number;
    cache_read: number;
    cache_write: number;
    cost_usd: number;
  },
): void {
  const key = `${agent}::${date}::${model}`;
  const existing = map.get(key);

  if (existing) {
    existing.input_tokens += tokens.input;
    existing.output_tokens += tokens.output;
    existing.cache_read_tokens += tokens.cache_read;
    existing.cache_write_tokens += tokens.cache_write;
    existing.cost_usd = (parseFloat(existing.cost_usd) + tokens.cost_usd).toFixed(6);
  } else {
    map.set(key, {
      agent,
      date,
      model,
      input_tokens: tokens.input,
      output_tokens: tokens.output,
      cache_read_tokens: tokens.cache_read,
      cache_write_tokens: tokens.cache_write,
      cost_usd: tokens.cost_usd.toFixed(6),
    });
  }
}

export function aggToRecords(map: AggMap): AggregateRecord[] {
  return Array.from(map.values());
}
