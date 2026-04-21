type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();
const STORAGE_PREFIX = 'karigar:cache:';

function readSessionRecord<T>(key: string): CacheRecord<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheRecord<T>;
    if (typeof parsed?.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionRecord<T>(key: string, record: CacheRecord<T>) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(record));
  } catch {
    // sessionStorage might be unavailable in some contexts
  }
}

export async function withClientCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();

  const memoryHit = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (memoryHit && memoryHit.expiresAt > now) {
    return memoryHit.value;
  }

  const sessionHit = readSessionRecord<T>(key);
  if (sessionHit && sessionHit.expiresAt > now) {
    memoryCache.set(key, sessionHit as CacheRecord<unknown>);
    return sessionHit.value;
  }

  const value = await fetcher();
  const record: CacheRecord<T> = {
    value,
    expiresAt: now + ttlMs,
  };

  memoryCache.set(key, record as CacheRecord<unknown>);
  writeSessionRecord(key, record);
  return value;
}

export function invalidateClientCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .forEach((key) => window.sessionStorage.removeItem(key));
    }
    return;
  }

  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }

  if (typeof window !== 'undefined') {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(`${STORAGE_PREFIX}${keyPrefix}`))
      .forEach((key) => window.sessionStorage.removeItem(key));
  }
}
