import { env } from "@server/core/env";
import Redis, { type Redis as RedisClient } from "ioredis";

type SIEMRedisClient = RedisClient & {
  executeSlidingCounter(
    currentKey: string,
    previousKey: string,
    maxRequests: string,
    windowSec: string,
    nowSec: string,
  ): Promise<[number, number]>;
};

export const redis = new Redis(env.REDIS_URL, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  commandTimeout: 1000,
}) as SIEMRedisClient;
