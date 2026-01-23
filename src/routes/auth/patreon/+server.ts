// initiates patreon oauth flow
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPatreonAuthUrl } from '$lib/server/patreon';
import { encodeBase64url } from '@oslojs/encoding';

export const GET: RequestHandler = async ({ url, cookies, request }) => {
	// handle proxied requests (cloudflare tunnel, etc)
	const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
	const host = request.headers.get('x-forwarded-host') || url.host;
	const origin = `${proto}://${host}`;
	const redirectUri = `${origin}/auth/patreon/callback`;

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
