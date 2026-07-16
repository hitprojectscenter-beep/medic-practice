// Thin KV wrapper with in-memory fallback for local/dev.
// When KV_REST_API_URL + KV_REST_API_TOKEN env vars are set (Vercel KV linked),
// data persists across cold starts. Otherwise, in-memory Map on the serverless
// instance until the next cold start.

import { kv as vercelKv } from "@vercel/kv";

const memStore: Map<string, any> =
  (globalThis as any).__medicKvMem || new Map();
(globalThis as any).__medicKvMem = memStore;

const useReal = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

export const kv = {
  isReal: () => useReal,

  async incr(key: string): Promise<number> {
    if (useReal) return vercelKv.incr(key);
    const v = (Number(memStore.get(key)) || 0) + 1;
    memStore.set(key, v);
    return v;
  },

  async get<T = any>(key: string): Promise<T | null> {
    if (useReal) return (await vercelKv.get<T>(key)) ?? null;
    return (memStore.get(key) as T) ?? null;
  },

  async set(key: string, value: any): Promise<void> {
    if (useReal) {
      await vercelKv.set(key, value);
      return;
    }
    memStore.set(key, value);
  },

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (useReal) {
      // @vercel/kv sadd accepts (key, member, ...rest)
      if (members.length === 0) return 0;
      return vercelKv.sadd(key, members[0], ...members.slice(1));
    }
    const s: Set<string> = memStore.get(key) || new Set<string>();
    let added = 0;
    for (const m of members) {
      if (!s.has(m)) {
        s.add(m);
        added++;
      }
    }
    memStore.set(key, s);
    return added;
  },

  async scard(key: string): Promise<number> {
    if (useReal) return vercelKv.scard(key);
    const s: Set<string> = memStore.get(key) || new Set<string>();
    return s.size;
  },

  async smembers(key: string): Promise<string[]> {
    if (useReal) return vercelKv.smembers(key);
    const s: Set<string> = memStore.get(key) || new Set<string>();
    return [...s];
  },

  async keys(pattern: string): Promise<string[]> {
    if (useReal) return vercelKv.keys(pattern);
    // Support only 'prefix:*' patterns for local fallback
    const prefix = pattern.replace(/\*$/, "");
    return [...memStore.keys()].filter((k) => k.startsWith(prefix));
  },

  async hincrby(key: string, field: string, amount = 1): Promise<number> {
    if (useReal) return vercelKv.hincrby(key, field, amount);
    const h: Record<string, number> = memStore.get(key) || {};
    h[field] = (Number(h[field]) || 0) + amount;
    memStore.set(key, h);
    return h[field];
  },

  async hgetall<T extends Record<string, unknown> = Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    if (useReal) {
      const v = await vercelKv.hgetall<T>(key);
      return v ?? null;
    }
    return (memStore.get(key) as T) || null;
  },
};
