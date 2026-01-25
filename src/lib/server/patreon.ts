// patreon oauth helpers
import { env } from '$env/dynamic/private';
import type { PatreonUserData } from './auth';

const PATREON_AUTH_URL = 'https://www.patreon.com/oauth2/authorize';
const PATREON_TOKEN_URL = 'https://www.patreon.com/api/oauth2/token';
const PATREON_IDENTITY_URL = 'https://www.patreon.com/api/oauth2/v2/identity';

// your campaign id for checking pledges
const CAMPAIGN_ID = env.PATREON_CAMPAIGN_ID;

export function getPatreonAuthUrl(redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: env.PATREON_CLIENT_ID || '',
		redirect_uri: redirectUri,
		scope: 'identity identity[email] identity.memberships',
		state
	});
	return `${PATREON_AUTH_URL}?${params}`;
}

export interface PatreonTokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export async function exchangeCodeForTokens(
	code: string,
	redirectUri: string
): Promise<PatreonTokens> {
	const res = await fetch(PATREON_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			grant_type: 'authorization_code',
			client_id: env.PATREON_CLIENT_ID || '',
			client_secret: env.PATREON_CLIENT_SECRET || '',
			redirect_uri: redirectUri
		})
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Patreon token exchange failed: ${text}`);
	}

	return res.json();
}

interface PatreonIdentityResponse {
	data: {
		id: string;
		attributes: {
			email?: string;
			full_name?: string;
			image_url?: string;
		};
	};
	included?: Array<{
		type: string;
		id: string;
		attributes: {
			// member attributes
			currently_entitled_amount_cents?: number;
			patron_status?: string;
			campaign_lifetime_support_cents?: number;
			// tier attributes
			title?: string;
			amount_cents?: number;
		};
		relationships?: {
			currently_entitled_tiers?: {
				data: Array<{ id: string; type: string }>;
			};
		};
	}>;
}

export async function getPatreonIdentity(accessToken: string): Promise<PatreonUserData> {
	const params = new URLSearchParams({
		'include': 'memberships,memberships.currently_entitled_tiers,memberships.campaign',
		'fields[user]': 'email,full_name,image_url',
		'fields[member]': 'patron_status,currently_entitled_amount_cents',
		'fields[tier]': 'title,amount_cents',
		'fields[campaign]': 'creation_name'
	});

	const res = await fetch(`${PATREON_IDENTITY_URL}?${params}`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Patreon identity fetch failed: ${text}`);
	}

	const data: PatreonIdentityResponse = await res.json();

	// find active membership for our campaign (or any with entitled amount)
	const membership = data.included?.find(
		(item) =>
			item.type === 'member' &&
			item.attributes.patron_status === 'active_patron' &&
			(item.attributes.currently_entitled_amount_cents ?? 0) > 0
	);

	const pledgeAmountCents = membership?.attributes.currently_entitled_amount_cents ?? null;

	// get tier name from Patreon (handles grandfathered prices correctly)
	let pledgeTier: string | null = null;
	const tierIds = membership?.relationships?.currently_entitled_tiers?.data ?? [];
	if (tierIds.length > 0) {
		// find the tier object in included
		const tierObj = data.included?.find(
			(item) => item.type === 'tier' && tierIds.some((t) => t.id === item.id)
		);
		if (tierObj?.attributes.title) {
			// normalize tier name (lowercase, handle variations)
			pledgeTier = normalizeTierName(tierObj.attributes.title);
		}
	}

	// fallback to amount-based detection if tier name not found
	if (!pledgeTier && pledgeAmountCents) {
		pledgeTier = determinePledgeTierByAmount(pledgeAmountCents);
	}

	return {
		patreonId: data.data.id,
		email: data.data.attributes.email ?? null,
		username: data.data.attributes.full_name ?? 'Patron',
		avatarUrl: data.data.attributes.image_url ?? null,
		pledgeTier,
		pledgeAmountCents
	};
}

// normalize patreon tier title to our internal tier name
function normalizeTierName(title: string): string | null {
	const normalized = title.toLowerCase().trim();
	// exact matches
	if (TIER_NAMES.includes(normalized)) return normalized;
	// partial matches (in case of "Tropfen Tier" or similar)
	for (const tier of TIER_NAMES) {
		if (normalized.includes(tier)) return tier;
	}
	return null;
}

const TIER_NAMES = ['tropfen', 'quelle', 'fluss', 'welle', 'ozean'];

// fallback: determine tier by amount (strict matching, no grandfathering)
// only used if tier title not available from patreon
function determinePledgeTierByAmount(amountCents: number): string | null {
	if (amountCents === 0) return null;
	for (const threshold of TIER_THRESHOLDS) {
		if (amountCents >= threshold) {
			return TIER_CONFIG[threshold].name;
		}
	}
	// custom amount below minimum tier = no tier benefits
	return null;
}

// tier config: amount in cents → tier name and seconds
// prices are in EUR: €4, €6, €12, €20, €40
export const TIER_CONFIG: Record<number, { name: string; seconds: number }> = {
	4000: { name: 'ozean', seconds: 150 * 60 },   // 150 min = 9000s
	2000: { name: 'welle', seconds: 75 * 60 },    // 75 min = 4500s
	1200: { name: 'fluss', seconds: 35 * 60 },    // 35 min = 2100s
	600: { name: 'quelle', seconds: 12 * 60 },    // 12 min = 720s
	400: { name: 'tropfen', seconds: 5 * 60 }     // 5 min = 300s
};

// sorted thresholds for tier lookup (highest first)
const TIER_THRESHOLDS = Object.keys(TIER_CONFIG)
	.map(Number)
	.sort((a, b) => b - a);

export function getSecondsForTier(tierName: string | null): number {
	if (!tierName) return 0;
	const entry = Object.values(TIER_CONFIG).find((t) => t.name === tierName);
	return entry?.seconds ?? 0;
}

export function getSecondsForAmount(amountCents: number | null): number {
	if (amountCents === null || amountCents === 0) return 0;

	for (const threshold of TIER_THRESHOLDS) {
		if (amountCents >= threshold) {
			return TIER_CONFIG[threshold].seconds;
		}
	}

	// custom amount below minimum tier = no seconds (use tier name for grandfathering)
	return 0;
}

// backwards compat aliases
export const getMinutesForTier = (tierName: string | null) => Math.floor(getSecondsForTier(tierName) / 60);
export const getMinutesForAmount = (amountCents: number | null) => Math.floor(getSecondsForAmount(amountCents) / 60);
