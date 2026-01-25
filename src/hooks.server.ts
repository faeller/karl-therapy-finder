import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { validateSessionToken, sessionCookieName } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { env } from '$env/dynamic/private';

// http basic auth for /debug (checked after session validation)
function checkDebugBasicAuth(request: Request): boolean {
	const secret = env.DEBUG_SECRET;
	if (!secret) return false;

	const auth = request.headers.get('authorization');
	if (auth?.startsWith('Basic ')) {
		const [, pass] = atob(auth.slice(6)).split(':');
		if (pass === secret) return true;
	}
	return false;
}

export const handle: Handle = async ({ event, resolve }) => {
	// session handling first
	const token = event.cookies.get(sessionCookieName);
	const d1 = await getD1(event.platform);

	if (token && d1) {
		try {
			const db = getDb(d1);
			const { session, user } = await validateSessionToken(db, token);
			event.locals.session = session;
			event.locals.user = user;
		} catch {
			event.locals.session = null;
			event.locals.user = null;
		}
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	// debug page access: require isAdmin AND http basic auth (dev mode always allowed)
	// TODO: re-enable basic auth check before production
	if (event.url.pathname.startsWith('/debug') && !import.meta.env.DEV) {
		const isAdmin = event.locals.user?.isAdmin === true;
		// const hasBasicAuth = checkDebugBasicAuth(event.request);

		if (!isAdmin) {
			return new Response('Unauthorized', {
				status: 401,
				headers: { 'WWW-Authenticate': 'Basic realm="KARL Debug"' }
			});
		}
	}

	// paraglide i18n
	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});
};
