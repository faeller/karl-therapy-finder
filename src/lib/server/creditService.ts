// credit service - handles call minute allocation and consumption
import { eq } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getMinutesForTier, getMinutesForAmount } from './patreon';

export interface UserCredits {
	total: number;
	used: number;
	remaining: number;
	tierMinutes: number;
	lastRefillAt: Date | null;
}

// get current credits, refreshing if new month
// prefers tierName over amountCents for accuracy with grandfathered prices
export async function getCredits(
	db: Database,
	userId: string,
	pledgeAmountCents: number | null,
	pledgeTier?: string | null
): Promise<UserCredits> {
	// prefer tier name (handles grandfathered prices), fallback to amount
	const tierMinutes = pledgeTier
		? getMinutesForTier(pledgeTier)
		: getMinutesForAmount(pledgeAmountCents);

	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	// no credits record yet
	if (!existing) {
		if (tierMinutes > 0) {
			// create initial credits
			await db.insert(table.userCallCredits).values({
				userId,
				creditsTotal: tierMinutes,
				creditsUsed: 0,
				creditsRefunded: 0,
				lastRefillAt: new Date()
			});
			return {
				total: tierMinutes,
				used: 0,
				remaining: tierMinutes,
				tierMinutes,
				lastRefillAt: new Date()
			};
		}
		return { total: 0, used: 0, remaining: 0, tierMinutes: 0, lastRefillAt: null };
	}

	// check if new month - refresh if so
	const now = new Date();
	const lastRefill = existing.lastRefillAt;
	const isNewMonth =
		lastRefill &&
		(lastRefill.getFullYear() < now.getFullYear() ||
			lastRefill.getMonth() < now.getMonth());

	if (isNewMonth && tierMinutes > 0) {
		await db
			.update(table.userCallCredits)
			.set({
				creditsTotal: tierMinutes,
				creditsUsed: 0,
				creditsRefunded: 0,
				lastRefillAt: now
			})
			.where(eq(table.userCallCredits.userId, userId));

		console.log(`[credits] refilled ${tierMinutes} minutes for user ${userId} (new month)`);

		return {
			total: tierMinutes,
			used: 0,
			remaining: tierMinutes,
			tierMinutes,
			lastRefillAt: now
		};
	}

	// return current credits
	const total = existing.creditsTotal ?? 0;
	const used = existing.creditsUsed ?? 0;
	const refunded = existing.creditsRefunded ?? 0;

	return {
		total,
		used,
		remaining: total - used + refunded,
		tierMinutes,
		lastRefillAt: existing.lastRefillAt
	};
}

// consume credits (called when scheduling a call)
// returns true if successful, false if insufficient credits
export async function consumeCredits(
	db: Database,
	userId: string,
	minutes: number
): Promise<boolean> {
	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	if (!existing) return false;

	const available =
		(existing.creditsTotal ?? 0) -
		(existing.creditsUsed ?? 0) +
		(existing.creditsRefunded ?? 0);

	if (available < minutes) return false;

	await db
		.update(table.userCallCredits)
		.set({ creditsUsed: (existing.creditsUsed ?? 0) + minutes })
		.where(eq(table.userCallCredits.userId, userId));

	return true;
}

// refund credits (e.g., if call fails before connecting)
export async function refundCredits(
	db: Database,
	userId: string,
	minutes: number
): Promise<void> {
	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	if (!existing) return;

	await db
		.update(table.userCallCredits)
		.set({ creditsRefunded: (existing.creditsRefunded ?? 0) + minutes })
		.where(eq(table.userCallCredits.userId, userId));
}
