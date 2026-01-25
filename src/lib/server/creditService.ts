// credit service - handles call seconds allocation and consumption
import { eq, and, or } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getSecondsForTier, getSecondsForAmount } from './patreon';
import { cancelBatchCall, triggerOutboundCall, getPracticeCallerAgentId, buildPracticeCallVariables } from './elevenlabs';
import { calculateNextCallSlot } from './aiService';

// default projected seconds per call (3 minutes)
export const DEFAULT_PROJECTED_SECONDS = 180;

// minimum seconds required for "last call" (when projected would block)
export const MINIMUM_LAST_CALL_SECONDS = 21;

export interface UserCredits {
	total: number;      // total seconds allocated this period
	used: number;       // seconds consumed
	refunded: number;   // seconds refunded
	available: number;  // total - used + refunded
	tierSeconds: number;
	lastRefillAt: Date | null;
}

// get current credits, refreshing if new month
export async function getCredits(
	db: Database,
	userId: string,
	pledgeAmountCents: number | null,
	pledgeTier?: string | null
): Promise<UserCredits> {
	const tierSeconds = pledgeTier
		? getSecondsForTier(pledgeTier)
		: getSecondsForAmount(pledgeAmountCents);

	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	// no credits record yet
	if (!existing) {
		if (tierSeconds > 0) {
			await db.insert(table.userCallCredits).values({
				userId,
				creditsTotal: tierSeconds,
				creditsUsed: 0,
				creditsRefunded: 0,
				lastRefillAt: new Date()
			});
			return {
				total: tierSeconds,
				used: 0,
				refunded: 0,
				available: tierSeconds,
				tierSeconds,
				lastRefillAt: new Date()
			};
		}
		return { total: 0, used: 0, refunded: 0, available: 0, tierSeconds: 0, lastRefillAt: null };
	}

	// check if new month - refresh if so
	const now = new Date();
	const lastRefill = existing.lastRefillAt;
	const isNewMonth =
		lastRefill &&
		(lastRefill.getFullYear() < now.getFullYear() ||
			lastRefill.getMonth() < now.getMonth());

	if (isNewMonth && tierSeconds > 0) {
		await db
			.update(table.userCallCredits)
			.set({
				creditsTotal: tierSeconds,
				creditsUsed: 0,
				creditsRefunded: 0,
				lastRefillAt: now
			})
			.where(eq(table.userCallCredits.userId, userId));

		console.log(`[credits] refilled ${tierSeconds}s for user ${userId} (new month)`);

		// try to unfreeze any frozen calls
		await unfreezeCallsIfPossible(db, userId, tierSeconds);

		return {
			total: tierSeconds,
			used: 0,
			refunded: 0,
			available: tierSeconds,
			tierSeconds,
			lastRefillAt: now
		};
	}

	const total = existing.creditsTotal ?? 0;
	const used = existing.creditsUsed ?? 0;
	const refunded = existing.creditsRefunded ?? 0;

	return {
		total,
		used,
		refunded,
		available: total - used + refunded,
		tierSeconds,
		lastRefillAt: existing.lastRefillAt
	};
}

// get projected seconds for all pending/scheduled calls
export async function getProjectedSeconds(db: Database, userId: string): Promise<number> {
	const pendingCalls = await db
		.select({ projectedSeconds: table.scheduledCalls.projectedSeconds })
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				or(
					eq(table.scheduledCalls.status, 'scheduled'),
					eq(table.scheduledCalls.status, 'in_progress')
				)
			)
		);

	return pendingCalls.reduce((sum, c) => sum + (c.projectedSeconds || DEFAULT_PROJECTED_SECONDS), 0);
}

// check if user can schedule a new call (has enough for projected liability)
export async function canScheduleCall(
	db: Database,
	userId: string,
	newCallProjectedSeconds: number = DEFAULT_PROJECTED_SECONDS
): Promise<{ canSchedule: boolean; available: number; projected: number }> {
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const available = (credits?.creditsTotal ?? 0) - (credits?.creditsUsed ?? 0) + (credits?.creditsRefunded ?? 0);

	const pendingCalls = await db
		.select({ projectedSeconds: table.scheduledCalls.projectedSeconds })
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				or(
					eq(table.scheduledCalls.status, 'scheduled'),
					eq(table.scheduledCalls.status, 'in_progress')
				)
			)
		);

	const projected = pendingCalls.reduce((sum, c) => sum + (c.projectedSeconds || DEFAULT_PROJECTED_SECONDS), 0);

	// normal case: enough for pending + new call
	if (available >= projected + newCallProjectedSeconds) {
		return { canSchedule: true, available, projected };
	}

	// last call case: at least minimum threshold remaining after projected
	// we'll eat any overage on this one
	if (available >= projected + MINIMUM_LAST_CALL_SECONDS) {
		return { canSchedule: true, available, projected };
	}

	return { canSchedule: false, available, projected };
}

// atomically check credits and reserve a slot by creating call record
// returns callId if successful, null if insufficient credits
export async function reserveCallSlot(
	db: Database,
	userId: string,
	callData: {
		id: string;
		therapistId: string;
		therapistName: string | null;
		therapistPhone: string;
		eId: string | null;
		scheduledAt: Date;
		callMetadata: string;
	}
): Promise<{ success: true; callId: string } | { success: false; reason: string; available: number; projected?: number }> {
	// note: D1 doesn't support SQL transactions, so this is check-then-insert (not atomic)
	// race conditions are unlikely given user interaction timing

	// check credits
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const available = (credits?.creditsTotal ?? 0) - (credits?.creditsUsed ?? 0) + (credits?.creditsRefunded ?? 0);

	// get projected seconds for pending calls
	const pendingCalls = await db
		.select({ projectedSeconds: table.scheduledCalls.projectedSeconds })
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				or(
					eq(table.scheduledCalls.status, 'scheduled'),
					eq(table.scheduledCalls.status, 'in_progress')
				)
			)
		);

	const projected = pendingCalls.reduce((sum, c) => sum + (c.projectedSeconds || DEFAULT_PROJECTED_SECONDS), 0);

	// check if allowed: normal case OR last call case (21s minimum after projected)
	const normalCaseOk = available >= projected + DEFAULT_PROJECTED_SECONDS;
	const lastCallOk = available >= projected + MINIMUM_LAST_CALL_SECONDS;

	if (!normalCaseOk && !lastCallOk) {
		return { success: false as const, reason: 'no_credits', available, projected };
	}

	// create call record
	const now = new Date();
	await db.insert(table.scheduledCalls).values({
		id: callData.id,
		userId,
		therapistId: callData.therapistId,
		therapistName: callData.therapistName,
		therapistPhone: callData.therapistPhone,
		eId: callData.eId,
		scheduledAt: callData.scheduledAt,
		attemptNumber: 1,
		maxAttempts: 12,
		status: 'scheduled',
		projectedSeconds: DEFAULT_PROJECTED_SECONDS,
		callMetadata: callData.callMetadata,
		createdAt: now,
		updatedAt: now
	});

	return { success: true as const, callId: callData.id };
}

// deduct seconds after call completes (capped at available to prevent debt)
// uses transaction for atomicity
// returns gifted seconds if we ate overage
export async function deductSeconds(
	db: Database,
	userId: string,
	actualSeconds: number
): Promise<{ deducted: number; remaining: number; giftedSeconds: number }> {
	// note: D1 doesn't support SQL transactions, using read-then-update
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	if (!credits) return { deducted: 0, remaining: 0, giftedSeconds: 0 };

	const available = (credits.creditsTotal ?? 0) - (credits.creditsUsed ?? 0) + (credits.creditsRefunded ?? 0);
	const deducted = Math.min(actualSeconds, available);
	const giftedSeconds = Math.max(0, actualSeconds - available);

	await db
		.update(table.userCallCredits)
		.set({ creditsUsed: (credits.creditsUsed ?? 0) + deducted })
		.where(eq(table.userCallCredits.userId, userId));

	const remaining = available - deducted;

	if (giftedSeconds > 0) {
		console.log(`[credits] deducted ${deducted}s, gifted ${giftedSeconds}s (actual: ${actualSeconds}s) to user ${userId}`);
	} else {
		console.log(`[credits] deducted ${deducted}s (actual: ${actualSeconds}s) from user ${userId}, remaining: ${remaining}s`);
	}

	return { deducted, remaining, giftedSeconds };
}

// freeze all pending calls for a user (cancel in elevenlabs, mark as frozen)
export async function freezePendingCalls(db: Database, userId: string): Promise<number> {
	const pendingCalls = await db
		.select()
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				eq(table.scheduledCalls.status, 'scheduled')
			)
		);

	let frozenCount = 0;
	for (const call of pendingCalls) {
		// cancel in elevenlabs
		if (call.elevenlabsConvId) {
			const cancelled = await cancelBatchCall(call.elevenlabsConvId);
			if (!cancelled) {
				console.warn(`[credits] failed to cancel batch ${call.elevenlabsConvId} for freeze`);
			}
		}

		// mark as frozen
		await db
			.update(table.scheduledCalls)
			.set({ status: 'frozen', updatedAt: new Date() })
			.where(eq(table.scheduledCalls.id, call.id));

		frozenCount++;
	}

	if (frozenCount > 0) {
		console.log(`[credits] froze ${frozenCount} pending calls for user ${userId}`);
	}

	return frozenCount;
}

// unfreeze calls if user has enough credits
export async function unfreezeCallsIfPossible(
	db: Database,
	userId: string,
	availableSeconds: number
): Promise<number> {
	const frozenCalls = await db
		.select()
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				eq(table.scheduledCalls.status, 'frozen')
			)
		);

	if (frozenCalls.length === 0) return 0;

	// calculate total projected for frozen calls
	const totalProjected = frozenCalls.reduce(
		(sum, c) => sum + (c.projectedSeconds || DEFAULT_PROJECTED_SECONDS),
		0
	);

	// check if we have enough to unfreeze all
	if (availableSeconds < totalProjected) {
		console.log(`[credits] not enough to unfreeze: available=${availableSeconds}s, needed=${totalProjected}s`);
		return 0;
	}

	let unfrozenCount = 0;
	for (const call of frozenCalls) {
		try {
			// parse call metadata for re-scheduling
			const metadata = call.callMetadata ? JSON.parse(call.callMetadata) : null;
			if (!metadata) {
				console.warn(`[credits] no metadata for frozen call ${call.id}, cannot unfreeze`);
				continue;
			}

			// calculate new schedule time
			const openingHours = metadata.openingHours || { regular: [] };
			const nextSlot = calculateNextCallSlot(openingHours);
			if (!nextSlot) {
				console.warn(`[credits] no available slot for frozen call ${call.id}`);
				continue;
			}

			// re-schedule with elevenlabs
			const result = await triggerOutboundCall({
				agentId: getPracticeCallerAgentId(),
				phoneNumber: call.therapistPhone,
				scheduledAt: nextSlot.date,
				callName: `karl_${call.id}`,
				dynamicVariables: buildPracticeCallVariables(
					metadata.patientName,
					metadata.patientInsurance,
					metadata.therapyType,
					metadata.callbackPhone,
					metadata.urgency,
					metadata.patientEmail,
					metadata.pronouns,
					metadata.joinWaitlist
				)
			});

			// update call record
			await db
				.update(table.scheduledCalls)
				.set({
					status: 'scheduled',
					scheduledAt: nextSlot.date,
					elevenlabsConvId: result.batchId,
					updatedAt: new Date()
				})
				.where(eq(table.scheduledCalls.id, call.id));

			unfrozenCount++;
			console.log(`[credits] unfroze call ${call.id}, new schedule: ${nextSlot.date.toISOString()}`);
		} catch (e) {
			console.error(`[credits] failed to unfreeze call ${call.id}:`, e);
		}
	}

	if (unfrozenCount > 0) {
		console.log(`[credits] unfroze ${unfrozenCount}/${frozenCalls.length} calls for user ${userId}`);
	}

	return unfrozenCount;
}

// add credits manually (admin function)
export async function addCredits(
	db: Database,
	userId: string,
	seconds: number
): Promise<void> {
	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	if (existing) {
		const newTotal = (existing.creditsTotal ?? 0) + seconds;
		await db
			.update(table.userCallCredits)
			.set({ creditsTotal: newTotal })
			.where(eq(table.userCallCredits.userId, userId));

		// try to unfreeze calls with new credits
		const available = newTotal - (existing.creditsUsed ?? 0) + (existing.creditsRefunded ?? 0);
		await unfreezeCallsIfPossible(db, userId, available);
	} else {
		await db.insert(table.userCallCredits).values({
			userId,
			creditsTotal: seconds,
			creditsUsed: 0,
			creditsRefunded: 0,
			lastRefillAt: new Date()
		});
	}
}

// refund credits (e.g., if call cancelled before connecting)
export async function refundCredits(
	db: Database,
	userId: string,
	seconds: number
): Promise<void> {
	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	if (!existing) return;

	const newRefunded = (existing.creditsRefunded ?? 0) + seconds;
	await db
		.update(table.userCallCredits)
		.set({ creditsRefunded: newRefunded })
		.where(eq(table.userCallCredits.userId, userId));

	// try to unfreeze calls with refunded credits
	const available = (existing.creditsTotal ?? 0) - (existing.creditsUsed ?? 0) + newRefunded;
	await unfreezeCallsIfPossible(db, userId, available);
}
