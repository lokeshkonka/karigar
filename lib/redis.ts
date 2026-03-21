import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const createRedisSingleton = () => {
  return new Redis(REDIS_URL);
};

type RedisSingleton = ReturnType<typeof createRedisSingleton>;

const globalForRedis = globalThis as unknown as {
  redis: RedisSingleton | undefined;
};

export const redis = globalForRedis.redis ?? createRedisSingleton();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
