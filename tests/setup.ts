import { mock } from "bun:test";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-token",
});

mock.module("server-only", () => ({}));
