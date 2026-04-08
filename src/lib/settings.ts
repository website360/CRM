import { prisma } from '@/lib/prisma';

// Cache settings in memory for 60s to avoid DB hits on every request
let cache: Map<string, string> = new Map();
let cacheTime = 0;
const CACHE_TTL = 60000;

export async function getSetting(key: string): Promise<string> {
  if (Date.now() - cacheTime > CACHE_TTL) {
    const all = await prisma.systemSetting.findMany();
    cache = new Map(all.map((s) => [s.key, s.value]));
    cacheTime = Date.now();
  }
  // Fallback to env vars
  return cache.get(key) || process.env[key] || '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache.set(key, value);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const all = await prisma.systemSetting.findMany();
  const result: Record<string, string> = {};
  for (const s of all) result[s.key] = s.value;
  return result;
}

export function clearCache() {
  cacheTime = 0;
}
