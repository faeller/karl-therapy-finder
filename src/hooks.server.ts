import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { validateSessionToken, sessionCookieName } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { env } from '$env/dynamic/private';
import { isAdmin } from '$lib/server/roles';

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

	// debug + admin page access: require admin AND http basic auth (dev mode always allowed)
	const isProtectedPath = event.url.pathname.startsWith('/debug') || event.url.pathname.startsWith('/admin');
	if (isProtectedPath && !import.meta.env.DEV) {
		const userIsAdmin = isAdmin(event.locals.user?.role);
		const hasBasicAuth = checkDebugBasicAuth(event.request);

		if (!userIsAdmin || !hasBasicAuth) {
			return new Response('Unauthorized', {
				status: 401,
				headers: { 'WWW-Authenticate': 'Basic realm="KARL Admin"' }
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
