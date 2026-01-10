// initiates patreon oauth flow
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPatreonAuthUrl } from '$lib/server/patreon';
import { encodeBase64url } from '@oslojs/encoding';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const redirectUri = `${url.origin}/auth/patreon/callback`;

	// generate state for csrf protection
	const state = encodeBase64url(crypto.getRandomValues(new Uint8Array(16)));
	cookies.set('patreon_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 10 // 10 min
	});

	const authUrl = getPatreonAuthUrl(redirectUri, state);
	redirect(302, authUrl);
};
