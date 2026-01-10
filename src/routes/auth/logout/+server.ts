// logout - invalidates session and clears cookie
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateSession, deleteSessionTokenCookie, sessionCookieName } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

export const GET: RequestHandler = async ({ cookies, platform }) => {
	const token = cookies.get(sessionCookieName);
	const d1 = await getD1(platform);

	if (token && d1) {
		try {
			const db = getDb(d1);
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			await invalidateSession(db, sessionId);
		} catch {
			// ignore db errors on logout
		}
	}
	deleteSessionTokenCookie({ cookies } as never);
	redirect(302, '/');
};
