// handles patreon oauth callback
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getPatreonIdentity } from '$lib/server/patreon';
import {
	upsertPatreonUser,
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('patreon_oauth_state');

	cookies.delete('patreon_oauth_state', { path: '/' });

	if (!code || !state || state !== storedState) {
		error(400, 'Invalid OAuth state');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	try {
		const db = getDb(d1);
		const redirectUri = `${url.origin}/auth/patreon/callback`;
		const tokens = await exchangeCodeForTokens(code, redirectUri);
		const patreonUser = await getPatreonIdentity(tokens.access_token);
		const userId = await upsertPatreonUser(db, patreonUser);

		const sessionToken = generateSessionToken();
		const session = await createSession(db, sessionToken, userId);
		setSessionTokenCookie({ cookies } as never, sessionToken, session.expiresAt);
	} catch (e) {
		console.error('Patreon OAuth error:', e);
		error(500, 'Authentication failed');
	}

	// redirect outside try/catch (redirect throws)
	redirect(302, '/account');
};
