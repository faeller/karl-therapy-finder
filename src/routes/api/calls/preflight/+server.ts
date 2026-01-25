// GET /api/calls/preflight?eId=xxx - fetch therapist details, opening hours, next call slot, existing calls
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { getTherapistDetails, checkCanScheduleCall } from '$lib/server/callService';
import { calculateNextCallSlot } from '$lib/server/aiService';
import { getCredits } from '$lib/server/creditService';
import { DEBUG_THERAPIST_ID } from '$lib/stores/debug';
import { enforceRateLimits, getClientId, LIMITS } from '$lib/server/ratelimit';

// helper to map call records consistently - returns all available fields
function mapCall(c: typeof table.scheduledCalls.$inferSelect) {
	return {
		id: c.id,
		status: c.status,
		outcome: c.outcome,
		scheduledAt: c.scheduledAt?.toISOString(),
		completedAt: c.completedAt?.toISOString(),
		createdAt: c.createdAt?.toISOString(),
		updatedAt: c.updatedAt?.toISOString(),
		durationSeconds: c.durationSeconds,
		appointmentDate: c.appointmentDate,
		appointmentTime: c.appointmentTime,
		callbackInfo: c.callbackInfo,
		rejectionReason: c.rejectionReason,
		notes: c.notes,
		transcript: c.transcript,
		analysis: c.analysis,
		// additional fields for detailed view
		elevenlabsConvId: c.elevenlabsConvId,
		attemptNumber: c.attemptNumber,
		maxAttempts: c.maxAttempts,
		therapistPhone: c.therapistPhone,
		attemptHistory: c.attemptHistory ? JSON.parse(c.attemptHistory) : null
	};
}

export const GET: RequestHandler = async ({ locals, platform, url, request }) => {
	if (!locals.user) {
		error(401, 'Not authenticated');
	}

	// rate limit before any expensive operations (per minute + per hour + daily)
	// daily limit triggers 30-day ban
	const kv = platform?.env?.THERAPIST_CACHE;
	const clientId = getClientId(locals.user.id, request);
	await enforceRateLimits(kv, clientId, [
		{ endpoint: 'preflight', config: LIMITS.callPreflight },
		{ endpoint: 'preflight_h', config: LIMITS.callPreflightHourly },
		{ endpoint: 'preflight_d', config: LIMITS.callPreflightDaily, triggersBan: true }
	]);

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);
	const eId = url.searchParams.get('eId');
	const wantsDebug = url.searchParams.get('isDebug') === 'true';

	// SECURITY: debug features require isAdmin
	const isAdmin = locals.user.isAdmin === true;
	const isDebug = wantsDebug && isAdmin;

	if (!eId) {
		error(400, 'Missing eId parameter');
	}

	// reject debug attempts from non-admins
	if ((wantsDebug || eId === DEBUG_THERAPIST_ID) && !isAdmin) {
		error(403, 'Debug mode requires admin access');
	}

	// for debug therapist (fake one), return mock data with immediate scheduling
	if (eId === DEBUG_THERAPIST_ID) {
		const now = new Date();
		const calls = await db
			.select()
			.from(table.scheduledCalls)
			.where(
				and(
					eq(table.scheduledCalls.userId, locals.user.id),
					eq(table.scheduledCalls.eId, 'debug')
				)
			)
			.orderBy(desc(table.scheduledCalls.createdAt))
			.limit(10);

		return json({
			therapist: {
				eId,
				name: 'Debug Test Therapist',
				phone: null,
				openingHours: { regular: [], notes: 'Debug mode - immediate call' }
			},
			nextSlot: {
				date: now.toISOString(),
				isSprechstunde: false,
				isImmediate: true
			},
			existingCalls: calls.map(mapCall),
			canSchedule: true
		});
	}

	// debug mode for real therapists - show real calculated time but schedule immediately
	if (isDebug) {
		const now = new Date();

		// get existing calls for this therapist
		const existingCalls = await db
			.select()
			.from(table.scheduledCalls)
			.where(
				and(
					eq(table.scheduledCalls.userId, locals.user.id),
					eq(table.scheduledCalls.eId, eId)
				)
			)
			.orderBy(desc(table.scheduledCalls.createdAt))
			.limit(10);

		// get credit details for display
		const debugCredits = await getCredits(
			db,
			locals.user.id,
			locals.user.pledgeAmountCents,
			locals.user.pledgeTier
		);

		// try to fetch real therapist details for opening hours display
		try {
			const { details } = await getTherapistDetails(db, eId, locals.user.id);

			// calculate what the real next slot would be (for display)
			const realNextSlot = calculateNextCallSlot(details.openingHours);

			return json({
				therapist: {
					eId: details.eId,
					name: details.name,
					phone: details.phone,
					address: details.address,
					openingHours: details.openingHours,
					fromCache: details.fromCache
				},
				nextSlot: realNextSlot ? {
					date: realNextSlot.date.toISOString(),
					isSprechstunde: realNextSlot.isSprechstunde,
					isImmediate: true // still call immediately in debug mode
				} : {
					date: now.toISOString(),
					isSprechstunde: false,
					isImmediate: true
				},
				existingCalls: existingCalls.map(mapCall),
				canSchedule: true,
				credits: {
					availableSeconds: debugCredits.available,
					projectedSeconds: 0,
					tierSeconds: debugCredits.tierSeconds,
					totalSeconds: debugCredits.total,
					pendingCalls: debugCredits.pendingCalls
				}
			});
		} catch {
			// fallback if therapist fetch fails
			return json({
				therapist: {
					eId,
					name: undefined,
					phone: null,
					openingHours: { regular: [] }
				},
				nextSlot: {
					date: now.toISOString(),
					isSprechstunde: false,
					isImmediate: true
				},
				existingCalls: existingCalls.map(mapCall),
				canSchedule: true,
				credits: {
					availableSeconds: debugCredits.available,
					projectedSeconds: 0,
					tierSeconds: debugCredits.tierSeconds,
					totalSeconds: debugCredits.total,
					pendingCalls: debugCredits.pendingCalls
				}
			});
		}
	}

	try {
		// fetch therapist details (uses cache if available)
		const { details, costUsd } = await getTherapistDetails(db, eId, locals.user.id);

		// calculate next call slot
		const nextSlot = calculateNextCallSlot(details.openingHours);

		// check if user can schedule
		const preflight = await checkCanScheduleCall(
			db,
			locals.user.id,
			eId,
			locals.user.pledgeTier
		);

		// get existing calls for this therapist by this user
		const existingCalls = await db
			.select()
			.from(table.scheduledCalls)
			.where(
				and(
					eq(table.scheduledCalls.userId, locals.user.id),
					eq(table.scheduledCalls.eId, eId)
				)
			)
			.orderBy(desc(table.scheduledCalls.createdAt))
			.limit(10);

		// get full credit details for component display
		const credits = await getCredits(
			db,
			locals.user.id,
			locals.user.pledgeAmountCents,
			locals.user.pledgeTier
		);

		return json({
			therapist: {
				eId: details.eId,
				name: details.name,
				phone: details.phone,
				address: details.address,
				openingHours: details.openingHours,
				fromCache: details.fromCache
			},
			nextSlot: nextSlot ? {
				date: nextSlot.date.toISOString(),
				isSprechstunde: nextSlot.isSprechstunde,
				isImmediate: false
			} : null,
			existingCalls: existingCalls.map(mapCall),
			canSchedule: preflight.canProceed,
			canScheduleReason: preflight.reason,
			creditsRemaining: preflight.creditsRemaining,
			projectedSeconds: preflight.projectedSeconds,
			credits: {
				availableSeconds: credits.available,
				projectedSeconds: preflight.projectedSeconds ?? 0,
				tierSeconds: credits.tierSeconds,
				totalSeconds: credits.total,
				pendingCalls: credits.pendingCalls
			},
			costUsd
		});
	} catch (e) {
		console.error('[preflight] failed:', e);
		error(500, e instanceof Error ? e.message : 'Failed to fetch therapist details');
	}
};
