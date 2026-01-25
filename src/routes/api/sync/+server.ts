// sync api - upload/download all app data as single encrypted blob
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { encrypt, decrypt } from '$lib/server/crypto';
import { env } from '$env/dynamic/private';
import { enforceRateLimit, getClientId, LIMITS } from '$lib/server/ratelimit';

interface SyncPayload {
	campaign?: unknown;
	contacts?: unknown[];
	chatState?: string;
	chatMessages?: unknown[];
	version?: number;
	// for conflict detection
	lastSyncedAt?: string;
	force?: boolean;
}

// get synced data
export const GET: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) error(401, 'Not authenticated');
	if (!locals.user.syncEnabled) error(403, 'Sync not enabled');

	// rate limit
	const kv = platform?.env?.THERAPIST_CACHE;
	await enforceRateLimit(kv, getClientId(locals.user.id, request), 'sync', LIMITS.sync);

	const d1 = await getD1(platform);
	if (!d1) error(500, 'Database not available');
	if (!env.SYNC_ENCRYPTION_KEY) {
		console.error('[sync] SYNC_ENCRYPTION_KEY not configured');
		error(500, 'Encryption not configured');
	}

	const db = getDb(d1);

	// use userCampaign table to store all app data
	const [row] = await db
		.select()
		.from(table.userCampaign)
		.where(eq(table.userCampaign.userId, locals.user.id))
		.limit(1);

	if (!row?.campaignData) {
		return json({ campaign: null, contacts: null, chatState: null, chatMessages: null, updatedAt: null });
	}

	try {
		const decrypted = await decrypt(row.campaignData, env);
		const data = JSON.parse(decrypted) as SyncPayload;
		return json({
			campaign: data.campaign ?? null,
			contacts: data.contacts ?? null,
			chatState: data.chatState ?? null,
			chatMessages: data.chatMessages ?? null,
			updatedAt: row.updatedAt?.toISOString() ?? null
		});
	} catch (e) {
		console.error('[sync] decrypt failed:', e);
		error(500, 'Failed to decrypt data');
	}
};

// upload synced data with conflict detection
export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) error(401, 'Not authenticated');
	if (!locals.user.syncEnabled) error(403, 'Sync not enabled');

	// rate limit (shares limit with GET)
	const kv = platform?.env?.THERAPIST_CACHE;
	await enforceRateLimit(kv, getClientId(locals.user.id, request), 'sync', LIMITS.sync);

	const d1 = await getD1(platform);
	if (!d1) error(500, 'Database not available');
	if (!env.SYNC_ENCRYPTION_KEY) {
		console.error('[sync] SYNC_ENCRYPTION_KEY not configured');
		error(500, 'Encryption not configured');
	}

	const db = getDb(d1);
	const body = await request.json() as SyncPayload;
	// truncate milliseconds - sqlite stores as seconds, must match for conflict detection
	const now = new Date();
	now.setMilliseconds(0);

	// fetch existing record for conflict check
	const [existing] = await db
		.select({ id: table.userCampaign.id, campaignData: table.userCampaign.campaignData, updatedAt: table.userCampaign.updatedAt })
		.from(table.userCampaign)
		.where(eq(table.userCampaign.userId, locals.user.id))
		.limit(1);

	// conflict detection: if client sends lastSyncedAt, check it matches server
	if (existing && body.lastSyncedAt && !body.force) {
		const serverUpdatedAt = existing.updatedAt?.toISOString();
		if (serverUpdatedAt && serverUpdatedAt !== body.lastSyncedAt) {
			// conflict - return 409 with server data so client can merge
			try {
				const decrypted = await decrypt(existing.campaignData!, env);
				const serverData = JSON.parse(decrypted) as SyncPayload;
				return json({
					conflict: true,
					serverData: {
						campaign: serverData.campaign ?? null,
						contacts: serverData.contacts ?? null,
						chatState: serverData.chatState ?? null,
						chatMessages: serverData.chatMessages ?? null,
						version: serverData.version ?? 1
					},
					serverUpdatedAt
				}, { status: 409 });
			} catch (e) {
				console.error('[sync] conflict check decrypt failed:', e);
				// fall through and overwrite if we can't read server data
			}
		}
	}

	try {
		// strip sync metadata before encrypting
		const { lastSyncedAt: _, force: __, ...dataToStore } = body;
		const encrypted = await encrypt(JSON.stringify(dataToStore), env);

		if (existing) {
			await db
				.update(table.userCampaign)
				.set({ campaignData: encrypted, updatedAt: now })
				.where(eq(table.userCampaign.id, existing.id));
		} else {
			await db.insert(table.userCampaign).values({
				id: nanoid(),
				userId: locals.user.id,
				campaignData: encrypted,
				updatedAt: now
			});
		}
	} catch (e) {
		console.error('[sync] encrypt failed:', e);
		error(500, 'Failed to encrypt data');
	}

	return json({ success: true, updatedAt: now.toISOString() });
};
