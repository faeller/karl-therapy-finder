// patreon oauth authentication
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { getDb, type Database } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'karl-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	return encodeBase64url(bytes);
}

export async function createSession(db: Database, token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(db: Database, token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			user: {
				id: table.user.id,
				username: table.user.username,
				email: table.user.email,
				avatarUrl: table.user.avatarUrl,
				pledgeTier: table.user.pledgeTier,
				pledgeAmountCents: table.user.pledgeAmountCents,
				syncEnabled: table.user.syncEnabled
			},
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(db: Database, sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' });
}

// patreon user upsert
export interface PatreonUserData {
	patreonId: string;
	email: string | null;
	username: string;
	avatarUrl: string | null;
	pledgeTier: string | null;
	pledgeAmountCents: number | null;
}

export async function upsertPatreonUser(db: Database, data: PatreonUserData): Promise<string> {
	const existing = await db
		.select({ id: table.user.id })
		.from(table.user)
		.where(eq(table.user.patreonId, data.patreonId))
		.limit(1);

	const now = new Date();

	if (existing.length > 0) {
		await db
			.update(table.user)
			.set({
				email: data.email,
				username: data.username,
				avatarUrl: data.avatarUrl,
				pledgeTier: data.pledgeTier,
				pledgeAmountCents: data.pledgeAmountCents,
				updatedAt: now
			})
			.where(eq(table.user.patreonId, data.patreonId));
		return existing[0].id;
	}

	const userId = nanoid();
	await db.insert(table.user).values({
		id: userId,
		patreonId: data.patreonId,
		email: data.email,
		username: data.username,
		avatarUrl: data.avatarUrl,
		pledgeTier: data.pledgeTier,
		pledgeAmountCents: data.pledgeAmountCents,
		syncEnabled: false,
		createdAt: now,
		updatedAt: now
	});
	return userId;
}

export async function updateSyncEnabled(db: Database, userId: string, enabled: boolean) {
	await db
		.update(table.user)
		.set({ syncEnabled: enabled, updatedAt: new Date() })
		.where(eq(table.user.id, userId));
}
