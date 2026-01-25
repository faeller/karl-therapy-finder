// credit service - handles call seconds allocation and consumption
import { eq, and, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Database } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getSecondsForTier, getSecondsForAmount } from './patreon';
import { cancelBatchCall, triggerOutboundCall, getPracticeCallerAgentId, buildPracticeCallVariables } from './elevenlabs';
import { calculateNextCallSlot } from './aiService';

// default projected seconds per call (3 minutes)
export const DEFAULT_PROJECTED_SECONDS = 180;

// minimum seconds required for "last call" (when projected would block)
export const MINIMUM_LAST_CALL_SECONDS = 21;

// optimistic locking helper - wraps credit updates with version check and retry
const MAX_RETRIES = 3;

async function withOptimisticLock<T>(
	db: Database,
	userId: string,
	updateFn: (credits: typeof table.userCallCredits.$inferSelect | undefined) => Promise<{
		updates: Partial<typeof table.userCallCredits.$inferInsert>;
		result: T;
	}>,
	retryCount = 0
): Promise<T> {
	// read current state
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const currentVersion = credits?.version ?? 0;

	// execute business logic
	const { updates, result } = await updateFn(credits);

	// optimistic lock: update with version check
	const dbResult = await db
		.update(table.userCallCredits)
		.set({
			...updates,
			version: currentVersion + 1
		})
		.where(
			and(
				eq(table.userCallCredits.userId, userId),
				eq(table.userCallCredits.version, currentVersion)
			)
		);

	// check if we won the race
	if (dbResult.changes === 0) {
		// version changed = concurrent modification
		if (retryCount >= MAX_RETRIES) {
			throw new Error(`optimistic lock failed after ${MAX_RETRIES} retries`);
		}

		// exponential backoff
		const backoffMs = 10 * Math.pow(5, retryCount);
		await new Promise(resolve => setTimeout(resolve, backoffMs));

		console.log(`[credits] retry ${retryCount + 1}/${MAX_RETRIES} for user ${userId}`);
		return withOptimisticLock(db, userId, updateFn, retryCount + 1);
	}

	// success
	if (retryCount > 0) {
		console.log(`[credits] succeeded after ${retryCount} retries for user ${userId}`);
	}

	return result;
}

// audit log helper - append-only record of credit operations
async function logCreditEvent(
	db: Database,
	userId: string,
	eventType: 'allocate' | 'reserve' | 'deduct' | 'refund' | 'freeze' | 'unfreeze',
	seconds: number,
	callId?: string,
	metadata?: Record<string, unknown>
): Promise<void> {
	// get current balance for audit trail
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const balanceBefore = credits
		? (credits.creditsTotal ?? 0) - (credits.creditsUsed ?? 0) + (credits.creditsRefunded ?? 0)
		: 0;

	// calculate balance after based on event type
	let balanceAfter = balanceBefore;
	if (eventType === 'allocate') balanceAfter = balanceBefore + seconds;
	if (eventType === 'deduct') balanceAfter = balanceBefore - seconds;
	if (eventType === 'refund') balanceAfter = balanceBefore + seconds;
	// reserve/freeze/unfreeze don't change actual balance, only projected

	await db.insert(table.creditAuditLog).values({
		id: nanoid(),
		userId,
		eventType,
		seconds,
		callId: callId ?? null,
		metadata: metadata ? JSON.stringify(metadata) : null,
		balanceBefore,
		balanceAfter,
		createdAt: new Date()
	});
}

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

	// no credits record yet - initial allocation
	if (!existing) {
		if (tierSeconds > 0) {
			const now = new Date();
			await db.insert(table.userCallCredits).values({
				userId,
				creditsTotal: tierSeconds,
				creditsUsed: 0,
				creditsRefunded: 0,
				version: 0,
				lastRefillAt: now,
				subscriptionStartedAt: now
			});

			await logCreditEvent(db, userId, 'allocate', tierSeconds, undefined, {
				source: 'initial_allocation',
				tier: pledgeTier ?? 'amount_based',
				amountCents: pledgeAmountCents
			});

			return {
				total: tierSeconds,
				used: 0,
				refunded: 0,
				available: tierSeconds,
				tierSeconds,
				lastRefillAt: now
			};
		}
		return { total: 0, used: 0, refunded: 0, available: 0, tierSeconds: 0, lastRefillAt: null };
	}

	// refill based on billing cycles since subscription started
	const now = new Date();
	const subscriptionStart = existing.subscriptionStartedAt || existing.lastRefillAt || now;
	const daysSinceSubscription = (now.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24);
	const currentCycle = Math.floor(daysSinceSubscription / 30);

	const lastRefillCycle = existing.lastRefillAt
		? Math.floor((existing.lastRefillAt.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24) / 30)
		: -1;

	if (currentCycle > lastRefillCycle && tierSeconds > 0) {
		let result;
		try {
			result = await withOptimisticLock(db, userId, async () => {
				await logCreditEvent(db, userId, 'allocate', tierSeconds, undefined, {
					source: 'monthly_refill',
					tier: pledgeTier ?? 'amount_based',
					amountCents: pledgeAmountCents,
					daysSinceSubscription: Math.floor(daysSinceSubscription),
					currentCycle,
					lastRefillCycle
				});

				return {
					updates: {
						creditsTotal: tierSeconds,
						creditsUsed: 0,
						creditsRefunded: 0,
						lastRefillAt: now,
						subscriptionStartedAt: existing.subscriptionStartedAt || now
					},
					result: {
						total: tierSeconds,
						used: 0,
						refunded: 0,
						available: tierSeconds,
						tierSeconds,
						lastRefillAt: now
					}
				};
			});
		} catch (e) {
			console.log(`[credits] refill race detected for user ${userId}, refetching`);
			return getCredits(db, userId, pledgeAmountCents, pledgeTier);
		}

		// unfreeze calls outside the lock to avoid blocking refill
		try {
			await unfreezeCallsIfPossible(db, userId, tierSeconds);
		} catch (e) {
			console.warn(`[credits] unfreeze failed after refill for user ${userId}:`, e);
			// don't fail the refill if unfreeze fails
		}

		return result;
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
// uses optimistic locking with retry to prevent race conditions
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
	// ensure user has credits record (create empty one if not)
	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	if (!existing) {
		const now = new Date();
		await db.insert(table.userCallCredits).values({
			userId,
			creditsTotal: 0,
			creditsUsed: 0,
			creditsRefunded: 0,
			version: 0,
			lastRefillAt: now,
			subscriptionStartedAt: now
		});
	}

	try {
		return await withOptimisticLock(db, userId, async (credits) => {
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
				throw new Error(`no_credits:${available}:${projected}`);
			}

			// create call record after lock acquired
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

			// audit log: reserve projected seconds
			await logCreditEvent(db, userId, 'reserve', DEFAULT_PROJECTED_SECONDS, callData.id, {
				therapistId: callData.therapistId,
				projected: DEFAULT_PROJECTED_SECONDS
			});

			return {
				updates: {}, // no credit fields changed, just version increment for lock
				result: { success: true as const, callId: callData.id }
			};
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);

		// parse no_credits error
		if (msg.startsWith('no_credits:')) {
			const [, availableStr, projectedStr] = msg.split(':');
			return {
				success: false as const,
				reason: 'no_credits',
				available: parseInt(availableStr),
				projected: parseInt(projectedStr)
			};
		}

		// contention after max retries
		if (msg.includes('optimistic lock failed')) {
			return { success: false as const, reason: 'contention', available: 0 };
		}

		throw e;
	}
}

// deduct seconds after call completes (capped at available to prevent debt)
// uses optimistic locking with retry to prevent race conditions
export async function deductSeconds(
	db: Database,
	userId: string,
	actualSeconds: number,
	callId?: string
): Promise<{ deducted: number; remaining: number; giftedSeconds: number }> {
	try {
		return await withOptimisticLock(db, userId, async (credits) => {
			if (!credits) {
				return {
					updates: {},
					result: { deducted: 0, remaining: 0, giftedSeconds: 0 }
				};
			}

			const available = (credits.creditsTotal ?? 0) - (credits.creditsUsed ?? 0) + (credits.creditsRefunded ?? 0);
			const deducted = Math.min(actualSeconds, available);
			const giftedSeconds = Math.max(0, actualSeconds - available);
			const remaining = available - deducted;

			if (giftedSeconds > 0) {
				console.log(`[credits] deducted ${deducted}s, gifted ${giftedSeconds}s (actual: ${actualSeconds}s) to user ${userId}`);
			} else {
				console.log(`[credits] deducted ${deducted}s (actual: ${actualSeconds}s) from user ${userId}, remaining: ${remaining}s`);
			}

			// audit log
			await logCreditEvent(db, userId, 'deduct', deducted, callId, {
				actualSeconds,
				deducted,
				giftedSeconds
			});

			return {
				updates: { creditsUsed: (credits.creditsUsed ?? 0) + deducted },
				result: { deducted, remaining, giftedSeconds }
			};
		});
	} catch (e) {
		// max retries exceeded - return 0 to avoid double-deduction
		console.warn(`[credits] deductSeconds failed for user ${userId}:`, e);
		return { deducted: 0, remaining: 0, giftedSeconds: 0 };
	}
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
// rate limited to max 5 calls per batch to avoid api throttling
const MAX_UNFREEZE_BATCH = 5;

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

	// limit batch size to avoid rate limiting
	const callsToUnfreeze = frozenCalls.slice(0, MAX_UNFREEZE_BATCH);
	if (frozenCalls.length > MAX_UNFREEZE_BATCH) {
		console.log(`[credits] limiting unfreeze batch to ${MAX_UNFREEZE_BATCH} of ${frozenCalls.length} frozen calls`);
	}

	// calculate total projected for calls we're unfreezing
	const totalProjected = callsToUnfreeze.reduce(
		(sum, c) => sum + (c.projectedSeconds || DEFAULT_PROJECTED_SECONDS),
		0
	);

	// check if we have enough to unfreeze this batch
	if (availableSeconds < totalProjected) {
		console.log(`[credits] not enough to unfreeze batch: available=${availableSeconds}s, needed=${totalProjected}s`);
		return 0;
	}

	let unfrozenCount = 0;
	for (const call of callsToUnfreeze) {
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
		const remaining = frozenCalls.length - unfrozenCount;
		console.log(`[credits] unfroze ${unfrozenCount}/${frozenCalls.length} calls for user ${userId}${remaining > 0 ? `, ${remaining} still frozen` : ''}`);
	}

	return unfrozenCount;
}

// add credits manually (admin function)
// uses optimistic locking with retry
export async function addCredits(
	db: Database,
	userId: string,
	seconds: number
): Promise<void> {
	let available = 0;
	let isNewRecord = false;
	try {
		await withOptimisticLock(db, userId, async (credits) => {
			if (!credits) {
				// no existing record, create initial
				const now = new Date();
				await db.insert(table.userCallCredits).values({
					userId,
					creditsTotal: seconds,
					creditsUsed: 0,
					creditsRefunded: 0,
					version: 0,
					lastRefillAt: now,
					subscriptionStartedAt: now
				});

				await logCreditEvent(db, userId, 'allocate', seconds, undefined, { source: 'manual_admin', initial: true });

				available = seconds;
				isNewRecord = true;
				return { updates: {}, result: undefined };
			}

			const newTotal = (credits.creditsTotal ?? 0) + seconds;
			available = newTotal - (credits.creditsUsed ?? 0) + (credits.creditsRefunded ?? 0);

			// audit log
			await logCreditEvent(db, userId, 'allocate', seconds, undefined, { source: 'manual_admin' });

			return {
				updates: { creditsTotal: newTotal },
				result: undefined
			};
		});

		// try to unfreeze calls with new credits (outside lock)
		if (available > 0) {
			await unfreezeCallsIfPossible(db, userId, available);
		}
	} catch (e) {
		console.warn(`[credits] addCredits failed for user ${userId}:`, e);
	}
}

// refund credits (e.g., if call cancelled before connecting)
// uses optimistic locking with retry
export async function refundCredits(
	db: Database,
	userId: string,
	seconds: number,
	callId?: string
): Promise<void> {
	let available = 0;
	try {
		await withOptimisticLock(db, userId, async (credits) => {
			if (!credits) {
				return { updates: {}, result: undefined };
			}

			const newRefunded = (credits.creditsRefunded ?? 0) + seconds;
			available = (credits.creditsTotal ?? 0) - (credits.creditsUsed ?? 0) + newRefunded;

			// audit log
			await logCreditEvent(db, userId, 'refund', seconds, callId, { reason: 'call_refund' });

			return {
				updates: { creditsRefunded: newRefunded },
				result: undefined
			};
		});

		// try to unfreeze calls with refunded credits (outside lock)
		if (available > 0) {
			await unfreezeCallsIfPossible(db, userId, available);
		}
	} catch (e) {
		console.warn(`[credits] refundCredits failed for user ${userId}:`, e);
	}
}

// reconcile audit log vs credits table (for monitoring/debugging)
export async function reconcileCredits(
	db: Database,
	userId: string
): Promise<{ match: boolean; table: number; audit: number; diff: number }> {
	// get current balance from table
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const tableBalance = credits
		? (credits.creditsTotal ?? 0) - (credits.creditsUsed ?? 0) + (credits.creditsRefunded ?? 0)
		: 0;

	// sum audit log
	const logs = await db
		.select()
		.from(table.creditAuditLog)
		.where(eq(table.creditAuditLog.userId, userId));

	let auditBalance = 0;
	for (const log of logs) {
		if (log.eventType === 'allocate') auditBalance += log.seconds;
		if (log.eventType === 'deduct') auditBalance -= log.seconds;
		if (log.eventType === 'refund') auditBalance += log.seconds;
		// reserve/freeze/unfreeze don't affect balance
	}

	const diff = tableBalance - auditBalance;
	const match = Math.abs(diff) < 1; // allow 1s rounding error

	return {
		match,
		table: tableBalance,
		audit: auditBalance,
		diff
	};
}
