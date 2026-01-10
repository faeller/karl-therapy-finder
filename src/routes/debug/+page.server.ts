// debug page server - load all debug data for elevenlabs integration testing
import type { PageServerLoad, Actions } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { desc, eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { getUserCredits, addCredits, getTherapistDetails } from '$lib/server/callService';
import { handleCallWebhook } from '$lib/server/callService';
import type { ElevenLabsWebhookPayload } from '$lib/server/elevenlabs';
import { env } from '$env/dynamic/private';

// auth handled in hooks.server.ts via HTTP Basic Auth

export const load: PageServerLoad = async ({ locals, platform }) => {

	const d1 = await getD1(platform);
	if (!d1) {
		return {
			user: locals.user,
			calls: [],
			credits: { total: 0, used: 0, refunded: 0, available: 0 },
			blocklist: [],
			cache: [],
			costEvents: [],
			envStatus: { configured: false, missing: [] }
		};
	}

	const db = getDb(d1);
	const userId = locals.user?.id;

	// load all debug data in parallel (handle missing tables gracefully)
	const safeQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
		try {
			return await fn();
		} catch (e) {
			console.warn('[debug] query failed (table might not exist):', e);
			return fallback;
		}
	};

	const [calls, credits, blocklist, cache, costEvents] = await Promise.all([
		// all calls for this user (or all if admin)
		safeQuery(
			() => userId
				? db.select().from(table.scheduledCalls).where(eq(table.scheduledCalls.userId, userId)).orderBy(desc(table.scheduledCalls.createdAt)).limit(50)
				: db.select().from(table.scheduledCalls).orderBy(desc(table.scheduledCalls.createdAt)).limit(50),
			[]
		),
		// credits
		safeQuery(
			() => userId ? getUserCredits(db, userId) : Promise.resolve({ total: 0, used: 0, refunded: 0, available: 0 }),
			{ total: 0, used: 0, refunded: 0, available: 0 }
		),
		// blocklist
		safeQuery(
			() => db.select().from(table.therapistBlocklist).orderBy(desc(table.therapistBlocklist.createdAt)).limit(50),
			[]
		),
		// therapist cache
		safeQuery(
			() => db.select({
				eId: table.therapistCache.eId,
				name: table.therapistCache.name,
				phone: table.therapistCache.phone,
				openingHours: table.therapistCache.openingHours,
				fetchedAt: table.therapistCache.fetchedAt,
				expiresAt: table.therapistCache.expiresAt
			}).from(table.therapistCache).orderBy(desc(table.therapistCache.fetchedAt)).limit(20),
			[]
		),
		// cost events
		safeQuery(
			() => userId
				? db.select().from(table.callCostEvents).where(eq(table.callCostEvents.userId, userId)).orderBy(desc(table.callCostEvents.createdAt)).limit(50)
				: db.select().from(table.callCostEvents).orderBy(desc(table.callCostEvents.createdAt)).limit(50),
			[]
		)
	]);

	// check env vars (check both env and process.env for dev compatibility)
	const getEnv = (key: string) => env[key] || process.env[key];
	const requiredEnvVars = [
		'ELEVENLABS_API_KEY',
		'ELEVENLABS_PHONE_NUMBER_ID',
		'ELEVENLABS_PRACTICE_AGENT_ID',
		'ELEVENLABS_WEBHOOK_SECRET',
		'OPENROUTER_API_KEY',
		'SYNC_ENCRYPTION_KEY'
	];
	const missing = requiredEnvVars.filter((v) => !getEnv(v));

	return {
		user: locals.user,
		calls: calls.map((c) => ({
			...c,
			scheduledAt: c.scheduledAt?.toISOString(),
			createdAt: c.createdAt?.toISOString(),
			updatedAt: c.updatedAt?.toISOString(),
			completedAt: c.completedAt?.toISOString()
		})),
		credits,
		blocklist: blocklist.map((b) => ({
			...b,
			createdAt: b.createdAt?.toISOString(),
			expiresAt: b.expiresAt?.toISOString()
		})),
		cache: cache.map((c) => ({
			...c,
			fetchedAt: c.fetchedAt?.toISOString(),
			expiresAt: c.expiresAt?.toISOString()
		})),
		costEvents: costEvents.map((e) => ({
			...e,
			createdAt: e.createdAt?.toISOString()
		})),
		envStatus: {
			configured: missing.length === 0,
			missing
		}
	};
};

export const actions: Actions = {
	// add credits for testing
	addCredits: async ({ locals, platform, request }) => {
		if (!locals.user) return { success: false, error: 'not authenticated' };

		const d1 = await getD1(platform);
		if (!d1) return { success: false, error: 'db not available' };

		const db = getDb(d1);
		const data = await request.formData();
		const amount = parseInt(data.get('amount') as string, 10) || 5;

		await addCredits(db, locals.user.id, amount);
		return { success: true, action: 'addCredits', amount };
	},

	// fetch therapist details (tests opening hours parsing)
	fetchTherapist: async ({ locals, platform, request }) => {
		if (!locals.user) return { success: false, error: 'not authenticated' };

		const d1 = await getD1(platform);
		if (!d1) return { success: false, error: 'db not available' };

		const db = getDb(d1);
		const data = await request.formData();
		const eId = data.get('eId') as string;

		if (!eId) return { success: false, error: 'eId required' };

		try {
			const { details, costUsd } = await getTherapistDetails(db, eId, locals.user.id);
			return {
				success: true,
				action: 'fetchTherapist',
				details: {
					...details,
					openingHours: details.openingHours
				},
				costUsd
			};
		} catch (e) {
			return { success: false, error: String(e) };
		}
	},

	// simulate webhook (for testing call outcomes without real calls)
	simulateWebhook: async ({ locals, platform, request }) => {
		if (!locals.user) return { success: false, error: 'not authenticated' };

		const d1 = await getD1(platform);
		if (!d1) return { success: false, error: 'db not available' };

		const db = getDb(d1);
		const data = await request.formData();
		const callId = data.get('callId') as string;
		const status = data.get('status') as string;
		const transcript = data.get('transcript') as string;
		const durationSeconds = parseInt(data.get('durationSeconds') as string, 10) || 60;

		if (!callId) return { success: false, error: 'callId required' };

		// get the call to find conversationId
		const [call] = await db.select().from(table.scheduledCalls).where(eq(table.scheduledCalls.id, callId)).limit(1);
		if (!call) return { success: false, error: 'call not found' };

		// simulate webhook payload
		const payload: ElevenLabsWebhookPayload = {
			conversation_id: call.elevenlabsConvId || `sim_${callId}`,
			status: (status as 'completed' | 'failed' | 'no_answer' | 'busy' | 'voicemail') || 'completed',
			duration_seconds: durationSeconds,
			transcript: transcript || undefined
		};

		// if no convId, set one so webhook can find it
		if (!call.elevenlabsConvId) {
			await db.update(table.scheduledCalls).set({ elevenlabsConvId: payload.conversation_id }).where(eq(table.scheduledCalls.id, callId));
		}

		try {
			await handleCallWebhook(db, payload);
			return { success: true, action: 'simulateWebhook', callId, status };
		} catch (e) {
			return { success: false, error: String(e) };
		}
	},

	// clear blocklist entry
	clearBlocklist: async ({ locals, platform, request }) => {
		if (!locals.user) return { success: false, error: 'not authenticated' };

		const d1 = await getD1(platform);
		if (!d1) return { success: false, error: 'db not available' };

		const db = getDb(d1);
		const data = await request.formData();
		const eId = data.get('eId') as string;

		if (!eId) return { success: false, error: 'eId required' };

		await db.delete(table.therapistBlocklist).where(eq(table.therapistBlocklist.eId, eId));
		return { success: true, action: 'clearBlocklist', eId };
	},

	// clear therapist cache
	clearCache: async ({ locals, platform, request }) => {
		if (!locals.user) return { success: false, error: 'not authenticated' };

		const d1 = await getD1(platform);
		if (!d1) return { success: false, error: 'db not available' };

		const db = getDb(d1);
		const data = await request.formData();
		const eId = data.get('eId') as string;

		if (!eId) return { success: false, error: 'eId required' };

		await db.delete(table.therapistCache).where(eq(table.therapistCache.eId, eId));
		return { success: true, action: 'clearCache', eId };
	},

	// schedule a test call (bypasses some preflight checks for testing)
	scheduleTestCall: async ({ locals, platform, request }) => {
		if (!locals.user) return { success: false, error: 'not authenticated' };

		const d1 = await getD1(platform);
		if (!d1) return { success: false, error: 'db not available' };

		const db = getDb(d1);
		const data = await request.formData();
		const eId = data.get('eId') as string;
		const patientName = (data.get('patientName') as string) || 'Test Patient';
		const patientInsurance = (data.get('patientInsurance') as string) || 'gesetzlich versichert';
		const therapyType = (data.get('therapyType') as string) || 'Verhaltenstherapie';
		const callbackPhone = (data.get('callbackPhone') as string) || '';
		const urgency = (data.get('urgency') as 'low' | 'medium' | 'high') || 'medium';
		const skipElevenLabs = data.get('skipElevenLabs') === 'true';

		if (!eId) return { success: false, error: 'eId required' };
		if (!callbackPhone) return { success: false, error: 'callback phone required' };

		try {
			// fetch therapist details (will use cache if available)
			const { details, costUsd } = await getTherapistDetails(db, eId, locals.user.id);

			if (!details.phone) {
				return { success: false, error: 'therapist has no phone number' };
			}

			// import scheduling functions
			const { nanoid } = await import('nanoid');
			const { calculateNextCallSlot } = await import('$lib/server/aiService');
			const { triggerOutboundCall, buildPracticeCallVariables, getPracticeCallerAgentId } = await import('$lib/server/elevenlabs');

			const now = new Date();
			const slot = calculateNextCallSlot(details.openingHours);

			if (!slot) {
				return { success: false, error: 'no available call slots found in opening hours' };
			}

			const callId = nanoid();

			// create call record
			await db.insert(table.scheduledCalls).values({
				id: callId,
				userId: locals.user.id,
				therapistId: eId,
				therapistName: details.name,
				therapistPhone: details.phone,
				eId: eId,
				scheduledAt: slot.date,
				attemptNumber: 1,
				maxAttempts: 3,
				status: 'scheduled',
				createdAt: now,
				updatedAt: now
			});

			let batchId = `test_${callId}`;

			// only trigger real call if not skipping
			if (!skipElevenLabs) {
				try {
					const variables = buildPracticeCallVariables(
						patientName,
						patientInsurance,
						therapyType,
						callbackPhone,
						urgency
					);

					const agentId = getPracticeCallerAgentId();
					const result = await triggerOutboundCall({
						agentId,
						phoneNumber: details.phone,
						dynamicVariables: variables,
						scheduledAt: slot.date,
						callName: `karl_test_${callId}`
					});

					batchId = result.batchId;
				} catch (e) {
					// update call with error but keep record
					await db.update(table.scheduledCalls).set({
						status: 'failed',
						notes: `elevenlabs error: ${String(e)}`,
						updatedAt: new Date()
					}).where(eq(table.scheduledCalls.id, callId));

					return { success: false, error: `elevenlabs error: ${String(e)}`, callId };
				}
			}

			// update with batch id
			await db.update(table.scheduledCalls).set({
				elevenlabsConvId: batchId,
				updatedAt: new Date()
			}).where(eq(table.scheduledCalls.id, callId));

			return {
				success: true,
				action: 'scheduleTestCall',
				callId,
				scheduledAt: slot.date.toISOString(),
				batchId,
				therapistName: details.name,
				therapistPhone: details.phone,
				costUsd,
				skippedElevenLabs: skipElevenLabs
			};
		} catch (e) {
			return { success: false, error: String(e) };
		}
	}
};
