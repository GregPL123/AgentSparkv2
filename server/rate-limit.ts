import { LRUCache } from 'lru-cache';

interface RateLimitResult {
    allowed: boolean;
    retryAfter: number; // in seconds
}

// In-memory cache for rate limiting
const tokenCache = new LRUCache<string, number[]>({
    max: 500,
    ttl: 60 * 1000, // 1 minute
});

const dailyCache = new LRUCache<string, number>({
    max: 1000,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
});

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
    // If Upstash Redis is configured, use it instead (placeholder)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        // TODO: Implement Upstash logic
    }

    const now = Date.now();
    const windowStart = now - 60 * 1000;

    // 1. Per-minute limit: 20 requests
    let requests = tokenCache.get(userId) || [];
    requests = requests.filter(ts => ts > windowStart);

    if (requests.length >= 20) {
        const oldestRequest = requests[0];
        const retryAfter = Math.ceil((oldestRequest + 60 * 1000 - now) / 1000);
        return { allowed: false, retryAfter };
    }

    requests.push(now);
    tokenCache.set(userId, requests);

    // 2. Daily limit: 200 requests (simplified in-memory tracking)
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `${userId}:${today}`;
    const dailyCount = dailyCache.get(dailyKey) || 0;

    if (dailyCount >= 200) {
        return { allowed: false, retryAfter: 3600 }; // 1 hour as default for daily limit
    }

    dailyCache.set(dailyKey, dailyCount + 1);

    return { allowed: true, retryAfter: 0 };
}
