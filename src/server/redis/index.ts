import { env } from "@/env";
import { Redis } from "ioredis";
import superjson from "superjson";

const redis = new Redis(env.REDIS_URL ?? "redis://localhost:6379");

class RedisCache {
  async set(key: string, value: object): Promise<void> {
    try {
      const serialized = superjson.stringify(value);
      await redis.set(key, serialized);
    } catch (error) {
      console.error("Error setting cache:", error);
      throw error;
    }
  }

  async get(key: string): Promise<object | undefined> {
    try {
      const value = await redis.get(key);
      if (!value) return undefined;
      return superjson.parse(value);
    } catch (error) {
      console.error("Error getting cache:", error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Error checking cache existence:", error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result === 1;
    } catch (error) {
      console.error("Error deleting from cache:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await redis.flushall();
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return await redis.keys("*");
    } catch (error) {
      console.error("Error getting cache keys:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const rediscache = new RedisCache();

export { rediscache as redis };
