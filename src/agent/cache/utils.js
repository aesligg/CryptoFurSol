import { CacheManager, DbCacheAdapter } from "@elizaos/core";

export function initializeCacheManager(databaseAdapter, identifier) {
  return new CacheManager(new DbCacheAdapter(databaseAdapter, identifier));
}
