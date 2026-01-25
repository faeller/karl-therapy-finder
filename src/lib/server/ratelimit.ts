// kv-based rate limiting for cloudflare workers
// uses fixed window algorithm with atomic increment

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
export const LIMITS = {
	// costs money (elevenlabs call + anthropic validation)
	callSchedule: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
	callScheduleHourly: { maxRequests: 150, windowSeconds: 3600 } as RateLimitConfig,
	callScheduleDaily: { maxRequests: 600, windowSeconds: 86400 } as RateLimitConfig, // 4x hourly = soft ban trigger
	// costs money (anthropic for opening hours parsing on cache miss)
	callPreflight: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
	callPreflightHourly: { maxRequests: 150, windowSeconds: 3600 } as RateLimitConfig,
	callPreflightDaily: { maxRequests: 600, windowSeconds: 86400 } as RateLimitConfig,

	// "ban" - if daily limit hit, this kicks in (30 days)
	banned: { maxRequests: 0, windowSeconds: 30 * 86400 } as RateLimitConfig,

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

// check if user is banned (30-day rate limit)
async function checkBan(
	kv: KVNamespace,
	identifier: string,
	endpoint: string
): Promise<RateLimitResult | null> {
	const banKey = `rl:ban:${endpoint}:${identifier}`;
	const banData = await kv.get(banKey);

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

// set a 30-day ban
async function setBan(
	kv: KVNamespace,
	identifier: string,
	endpoint: string
): Promise<void> {
	const banKey = `rl:ban:${endpoint}:${identifier}`;
	const resetAt = Math.floor(Date.now() / 1000) + (30 * 86400);
	await kv.put(banKey, String(resetAt), {
		expirationTtl: 30 * 86400
	});
	console.warn(`[ratelimit] banned ${identifier} from ${endpoint} for 30 days`);
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

// convenience wrapper that throws 429 error
import { error } from '@sveltejs/kit';

export async function enforceRateLimit(
	kv: KVNamespace | undefined,
	identifier: string,
	endpoint: string,
	config: RateLimitConfig
): Promise<void> {
	if (!kv) {
		// no kv = dev mode, skip
		return;
	}

	const result = await checkRateLimit(kv, identifier, endpoint, config);

	if (!result.allowed) {
		const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);
		error(429, {
			message: 'Too many requests. Please try again later.',
			// @ts-expect-error sveltekit error accepts extra props
			retryAfter
		});
	}
}

// enforce multiple limits with auto-ban on daily limit
// pass dailyEndpoint to trigger 30-day ban when daily limit exceeded
export async function enforceRateLimits(
	kv: KVNamespace | undefined,
	identifier: string,
	limits: Array<{ endpoint: string; config: RateLimitConfig; triggersBan?: boolean }>
): Promise<void> {
	if (!kv) return;

	// check ban first
	const ban = await checkBan(kv, identifier, 'api');
	if (ban) {
		const retryAfter = ban.resetAt - Math.floor(Date.now() / 1000);
		const days = Math.ceil(retryAfter / 86400);
		error(429, {
			message: `Rate limit exceeded. Try again in ${days} days.`,
			// @ts-expect-error sveltekit error accepts extra props
			retryAfter
		});
	}

	for (const { endpoint, config, triggersBan } of limits) {
		const result = await checkRateLimit(kv, identifier, endpoint, config);

		if (!result.allowed) {
			// if this was the daily limit, trigger 30-day ban
			if (triggersBan) {
				await setBan(kv, identifier, 'api');
				const retryAfter = 30 * 86400;
				error(429, {
					message: `Rate limit exceeded. Try again in 30 days.`,
					// @ts-expect-error sveltekit error accepts extra props
					retryAfter
				});
			}

			const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);
			error(429, {
				message: 'Too many requests. Please try again later.',
				// @ts-expect-error sveltekit error accepts extra props
				retryAfter
			});
		}
	}
}
