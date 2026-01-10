import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { validateSessionToken, sessionCookieName } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { env } from '$env/dynamic/private';

// http basic auth for /debug
function checkDebugAuth(request: Request, pathname: string): Response | null {
	if (!pathname.startsWith('/debug')) return null;
	if (import.meta.env.DEV) return null;

	const secret = env.DEBUG_SECRET;
	if (!secret) {
		console.error('[debug] DEBUG_SECRET not configured in production');
		return new Response('Debug page not configured', { status: 503 });
	}

	const auth = request.headers.get('authorization');
	if (auth?.startsWith('Basic ')) {
		const [, pass] = atob(auth.slice(6)).split(':');
		if (pass === secret) return null; // auth ok
	}

	return new Response('Unauthorized', {
		status: 401,
		headers: { 'WWW-Authenticate': 'Basic realm="KARL Debug"' }
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	// debug page auth
	const authResponse = checkDebugAuth(event.request, event.url.pathname);
	if (authResponse) return authResponse;
	// session handling
	const token = event.cookies.get(sessionCookieName);
	const d1 = await getD1(event.platform);

	if (token && d1) {
		try {
			const db = getDb(d1);
			const { session, user } = await validateSessionToken(db, token);
			event.locals.session = session;
			event.locals.user = user;
		} catch {
			// db error - proceed without auth
			event.locals.session = null;
			event.locals.user = null;
		}
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	// paraglide i18n
	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});
};
