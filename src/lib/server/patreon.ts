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
			currently_entitled_amount_cents?: number;
			patron_status?: string;
			campaign_lifetime_support_cents?: number;
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
	const pledgeTier = determinePledgeTier(pledgeAmountCents);

	return {
		patreonId: data.data.id,
		email: data.data.attributes.email ?? null,
		username: data.data.attributes.full_name ?? 'Patron',
		avatarUrl: data.data.attributes.image_url ?? null,
		pledgeTier,
		pledgeAmountCents
	};
}

function determinePledgeTier(amountCents: number | null): string | null {
	if (amountCents === null || amountCents === 0) return null;
	if (amountCents >= 1000) return 'premium'; // $10+
	if (amountCents >= 500) return 'supporter'; // $5+
	return 'backer'; // any amount
}
