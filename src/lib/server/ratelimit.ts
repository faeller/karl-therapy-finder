// kv-based rate limiting for cloudflare workers
// uses fixed window algorithm with atomic increment

// in-memory fallback for dev (no KV available)
const devStore = new Map<string, { value: string; expiresAt: number }>();

// DEV ONLY: auto-trigger limits on first request (set to false to use manual debug controls)
// set to 'ban' | 'hourly' | 'minute' | false
const DEV_TEST_LIMIT: 'ban' | 'hourly' | 'minute' | false = false;

// dynamic population happens in enforceRateLimits on first request

// debug helpers for viewing/modifying rate limits
export async function getRateLimitEntries(kv: KVNamespace | undefined): Promise<Array<{ key: string; value: string; expiresIn: number }>> {
	const entries: Array<{ key: string; value: string; expiresIn: number }> = [];
	const now = Date.now();

	if (kv) {
		// list all rl: keys from real KV
		const list = await kv.list({ prefix: 'rl:' });
		for (const key of list.keys) {
			const { value, metadata } = await kv.getWithMetadata<{ expiresAt?: number }>(key.name);
			if (value) {
				// use metadata.expiresAt if available, otherwise estimate
				const expiresAt = metadata?.expiresAt;
				const expiresIn = expiresAt ? Math.max(0, Math.round((expiresAt - now) / 1000)) : 60;
				entries.push({ key: key.name, value, expiresIn });
			}
		}
	} else {
		// fallback to devStore
		for (const [key, v] of devStore.entries()) {
			if (v.expiresAt > now) {
				entries.push({
					key,
					value: v.value,
					expiresIn: Math.round((v.expiresAt - now) / 1000)
				});
			}
		}
	}

	return entries;
}

export async function clearRateLimits(kv: KVNamespace | undefined): Promise<void> {
	if (kv) {
		// list and delete all rl: keys from real KV
		const list = await kv.list({ prefix: 'rl:' });
		for (const key of list.keys) {
			await kv.delete(key.name);
		}
		console.log(`[ratelimit] cleared ${list.keys.length} entries from KV`);
	}
	devStore.clear();
}

export async function deleteRateLimitEntry(kv: KVNamespace | undefined, key: string): Promise<void> {
	if (kv) {
		await kv.delete(key);
	}
	devStore.delete(key);
	console.log(`[ratelimit] deleted ${key}`);
}

export async function triggerTestLimit(kv: KVNamespace | undefined, identifier: string, type: 'minute' | 'hourly' | 'ban'): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	console.log(`[ratelimit] triggerTestLimit: identifier=${identifier}, type=${type}, kv=${kv ? 'real' : 'devStore'}`);

	const store = kv || getDevStore();

	if (type === 'minute') {
		const windowStart = Math.floor(now / 60) * 60;
		const key1 = `rl:preflight:${identifier}:${windowStart}`;
		const key2 = `rl:schedule:${identifier}:${windowStart}`;
		const expiresAt = Date.now() + 60000;
		await store.put(key1, '3', { expirationTtl: 60, metadata: { expiresAt } });
		await store.put(key2, '3', { expirationTtl: 60, metadata: { expiresAt } });
		console.log(`[ratelimit] set ${key1} and ${key2}`);
	} else if (type === 'hourly') {
		const windowStart = Math.floor(now / 120) * 120;
		const expiresAt = Date.now() + 120000;
		await store.put(`rl:preflight_h:${identifier}:${windowStart}`, '5', { expirationTtl: 120, metadata: { expiresAt } });
		await store.put(`rl:schedule_h:${identifier}:${windowStart}`, '5', { expirationTtl: 120, metadata: { expiresAt } });
	} else if (type === 'ban') {
		const banDuration = 5 * 86400;
		const resetAt = now + banDuration;
		const banKey = `rl:ban:api:${identifier}`;
		const expiresAt = Date.now() + banDuration * 1000;
		await store.put(banKey, String(resetAt), { expirationTtl: banDuration, metadata: { expiresAt } });
		console.log(`[ratelimit] set ban key ${banKey} = ${resetAt}`);
	}
}

export { DEV_MODE, DEV_TEST_LIMIT };

function getDevStore(): KVNamespace {
	return {
		async get(key: string) {
			const entry = devStore.get(key);
			console.log(`[devStore.get] key=${key}, entry=`, entry, `now=${Date.now()}`);
			if (!entry) return null;
			if (entry.expiresAt < Date.now()) {
				console.log(`[devStore.get] EXPIRED: expiresAt=${entry.expiresAt} < now=${Date.now()}`);
				devStore.delete(key);
				return null;
			}
			console.log(`[devStore.get] returning value: ${entry.value}`);
			return entry.value;
		},
		async put(key: string, value: string, options?: { expirationTtl?: number }) {
			const expiresAt = Date.now() + (options?.expirationTtl || 60) * 1000;
			devStore.set(key, { value, expiresAt });
		}
	} as unknown as KVNamespace;
}

export interface RateLimitConfig {
	maxRequests: number;
	windowSeconds: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number; // unix timestamp
}

// preset limits for different contexts
// main goal: prevent denial of wallet (anthropic/elevenlabs api abuse)
const DEV_MODE = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export const LIMITS = {
	// costs money (elevenlabs call + anthropic validation)
	callSchedule: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
	callScheduleHourly: { maxRequests: 150, windowSeconds: 3600 } as RateLimitConfig,
	callScheduleDaily: { maxRequests: 600, windowSeconds: 86400 } as RateLimitConfig,
	// costs money (anthropic for opening hours parsing on cache miss)
	callPreflight: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
	callPreflightHourly: { maxRequests: 150, windowSeconds: 3600 } as RateLimitConfig,
	callPreflightDaily: { maxRequests: 600, windowSeconds: 86400 } as RateLimitConfig,

	// "ban" - if daily limit hit, this kicks in (5 days)
	banned: { maxRequests: 0, windowSeconds: 5 * 86400 } as RateLimitConfig,

	// no external api cost, just db
	sync: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
	therapistSearch: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,

	// auth endpoints
	auth: { maxRequests: 20, windowSeconds: 60 } as RateLimitConfig
} as const;

// check and increment rate limit counter
// returns whether request is allowed
export async function checkRateLimit(
	kv: KVNamespace,
	identifier: string, // userId, ip, or combo
	endpoint: string,
	config: RateLimitConfig
): Promise<RateLimitResult> {
	const now = Math.floor(Date.now() / 1000);
	const windowStart = Math.floor(now / config.windowSeconds) * config.windowSeconds;
	const key = `rl:${endpoint}:${identifier}:${windowStart}`;

	// get current count
	const current = await kv.get(key);
	const count = current ? parseInt(current, 10) : 0;

	if (count >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: windowStart + config.windowSeconds
		};
	}

	// increment (kv doesn't have atomic increment, but race conditions here just mean slightly loose limits which is fine)
	await kv.put(key, String(count + 1), {
		expirationTtl: config.windowSeconds + 10 // small buffer
	});

	return {
		allowed: true,
		remaining: config.maxRequests - count - 1,
		resetAt: windowStart + config.windowSeconds
	};
}

// check if user is banned (5-day rate limit)
async function checkBan(
	kv: KVNamespace,
	identifier: string,
	endpoint: string
): Promise<RateLimitResult | null> {
	const banKey = `rl:ban:${endpoint}:${identifier}`;
	console.log(`[ratelimit] checkBan looking for key: ${banKey}`);
	console.log(`[ratelimit] devStore has ${devStore.size} entries:`, Array.from(devStore.keys()));

	const banData = await kv.get(banKey);
	console.log(`[ratelimit] checkBan result for ${banKey}:`, banData);

	if (banData) {
		const resetAt = parseInt(banData, 10);
		return {
			allowed: false,
			remaining: 0,
			resetAt
		};
	}
	return null;
}

// set a 5-day ban
async function setBan(
	kv: KVNamespace,
	identifier: string,
	endpoint: string
): Promise<void> {
	const banKey = `rl:ban:${endpoint}:${identifier}`;
	const resetAt = Math.floor(Date.now() / 1000) + (5 * 86400);
	await kv.put(banKey, String(resetAt), {
		expirationTtl: 5 * 86400
	});
	console.warn(`[ratelimit] banned ${identifier} from ${endpoint} for 5 days`);
}

// helper to get client identifier (prefer userId, fallback to ip)
export function getClientId(
	userId: string | undefined,
	request: Request
): string {
	if (userId) return `u:${userId}`;

	// cf-connecting-ip is most reliable on cloudflare
	const ip = request.headers.get('cf-connecting-ip')
		|| request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
		|| 'unknown';

	return `ip:${ip}`;
}

import { error } from '@sveltejs/kit';

// custom error class that includes retryAfter
export class RateLimitError extends Error {
	status = 429;
	retryAfter: number;

	constructor(message: string, retryAfter: number) {
		super(message);
		this.retryAfter = retryAfter;
	}
}

// helper to throw 429 with retryAfter
function throw429(message: string, retryAfter: number): never {
	// pass object directly - SvelteKit will serialize it
	error(429, { message, retryAfter } as any);
}

export async function enforceRateLimit(
	kv: KVNamespace | undefined,
	identifier: string,
	endpoint: string,
	config: RateLimitConfig
): Promise<void> {
	// use real KV when available, fallback to devStore
	const store = kv || getDevStore();

	const result = await checkRateLimit(store, identifier, endpoint, config);

	if (!result.allowed) {
		const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);
		throw429('Too many requests. Please try again later.', retryAfter);
	}
}

// enforce multiple limits with auto-ban on daily limit
// pass dailyEndpoint to trigger 5-day ban when daily limit exceeded
export async function enforceRateLimits(
	kv: KVNamespace | undefined,
	identifier: string,
	limits: Array<{ endpoint: string; config: RateLimitConfig; triggersBan?: boolean }>
): Promise<void> {
	// use real KV when available, fallback to devStore
	const store = kv || getDevStore();

	// DEV ONLY: dynamically populate limit for this user on first request
	if (DEV_TEST_LIMIT && DEV_MODE) {
		const now = Math.floor(Date.now() / 1000);
		const populatedKey = `_populated:${identifier}`;
		const alreadyPopulated = devStore.has(populatedKey);

		console.log(`[ratelimit] DEV: identifier=${identifier}, alreadyPopulated=${alreadyPopulated}, DEV_TEST_LIMIT=${DEV_TEST_LIMIT}`);
		console.log(`[ratelimit] DEV: devStore size=${devStore.size}, keys=`, Array.from(devStore.keys()));

		if (!alreadyPopulated) {
			devStore.set(populatedKey, { value: '1', expiresAt: Date.now() + 300000 });

			if (DEV_TEST_LIMIT === 'minute') {
				const windowStart = Math.floor(now / 60) * 60;
				const key1 = `rl:preflight:${identifier}:${windowStart}`;
				const key2 = `rl:schedule:${identifier}:${windowStart}`;
				devStore.set(key1, { value: '3', expiresAt: Date.now() + 60000 });
				devStore.set(key2, { value: '3', expiresAt: Date.now() + 60000 });
				console.log(`[ratelimit] DEV: set ${key1} and ${key2} to 3`);
			} else if (DEV_TEST_LIMIT === 'hourly') {
				const windowStart = Math.floor(now / 120) * 120;
				devStore.set(`rl:preflight_h:${identifier}:${windowStart}`, { value: '5', expiresAt: Date.now() + 120000 });
				devStore.set(`rl:schedule_h:${identifier}:${windowStart}`, { value: '5', expiresAt: Date.now() + 120000 });
			} else if (DEV_TEST_LIMIT === 'ban') {
				const banDuration = 5 * 86400;
				const resetAt = now + banDuration;
				devStore.set(`rl:ban:api:${identifier}`, { value: String(resetAt), expiresAt: Date.now() + banDuration * 1000 });
			}
			console.log(`[ratelimit] DEV: populated ${DEV_TEST_LIMIT} limit for ${identifier}`);
		}
	}

	// check ban first
	const ban = await checkBan(store, identifier, 'api');
	console.log(`[ratelimit] checking ban for ${identifier}:`, ban ? `banned until ${ban.resetAt}` : 'not banned');
	if (ban) {
		const retryAfter = ban.resetAt - Math.floor(Date.now() / 1000);
		const days = Math.ceil(retryAfter / 86400);
		console.log(`[ratelimit] BLOCKED by ban, retryAfter=${retryAfter}s`);
		throw429(`Temporarily rate-limited for excessive requests. Try again in ${days} days.`, retryAfter);
	}

	for (const { endpoint, config, triggersBan } of limits) {
		const result = await checkRateLimit(store, identifier, endpoint, config);

		if (!result.allowed) {
			// if this was the daily limit, trigger 5-day ban
			if (triggersBan) {
				await setBan(store, identifier, 'api');
				const retryAfter = 5 * 86400;
				throw429(`Temporarily rate-limited for excessive requests. Try again in 5 days.`, retryAfter);
			}

			const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);
			throw429('Too many requests. Please try again later.', retryAfter);
		}
	}
}
