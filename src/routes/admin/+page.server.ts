import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { isAdmin, isModerator } from '$lib/server/roles';
import { eq, desc, sql, and, or, inArray } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { unfreezeCallsIfPossible, freezePendingCalls } from '$lib/server/creditService';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user || !isAdmin(locals.user.role)) {
		redirect(302, '/chat');
	}

	const d1 = await getD1(platform);
	if (!d1) error(500, 'Database not available');
	const db = getDb(d1);

	// fetch all data in parallel
	const [
		users,
		calls,
		credits,
		blocklist,
		validationOverrides,
		privacyIncidents,
		costEvents,
		auditLog,
		webhookLogs
	] = await Promise.all([
		// all users with their roles
		db.select().from(table.user).orderBy(desc(table.user.createdAt)),

		// all calls (recent 500)
		db.select().from(table.scheduledCalls).orderBy(desc(table.scheduledCalls.createdAt)).limit(500),

		// all credit records
		db.select().from(table.userCallCredits),

		// blocklist
		db.select().from(table.therapistBlocklist).orderBy(desc(table.therapistBlocklist.createdAt)),

		// validation overrides
		db.select().from(table.validationOverrides).orderBy(desc(table.validationOverrides.createdAt)),

		// privacy incidents
		db.select().from(table.privacyIncidents).orderBy(desc(table.privacyIncidents.createdAt)).limit(100),

		// cost events (recent 200)
		db.select().from(table.callCostEvents).orderBy(desc(table.callCostEvents.createdAt)).limit(200),

		// credit audit log (recent 200)
		db.select().from(table.creditAuditLog).orderBy(desc(table.creditAuditLog.createdAt)).limit(200),

		// webhook logs (recent 100)
		db.select().from(table.webhookLogs).orderBy(desc(table.webhookLogs.createdAt)).limit(100)
	]);

	// compute stats
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

	const totalUsers = users.length;
	const patrons = users.filter(u => u.pledgeTier && u.pledgeTier !== 'free');
	const patronsByTier = patrons.reduce((acc, u) => {
		acc[u.pledgeTier!] = (acc[u.pledgeTier!] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const totalCallSeconds = calls
		.filter(c => c.status === 'completed' && c.durationSeconds)
		.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);

	const monthCallSeconds = calls
		.filter(c => c.status === 'completed' && c.durationSeconds && c.completedAt && c.completedAt >= monthStart)
		.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);

	const callsByStatus = calls.reduce((acc, c) => {
		acc[c.status] = (acc[c.status] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const callsByOutcome = calls.filter(c => c.outcome).reduce((acc, c) => {
		acc[c.outcome!] = (acc[c.outcome!] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	// monthly revenue estimate (sum of pledgeAmountCents)
	const monthlyRevenueCents = patrons.reduce((sum, u) => sum + (u.pledgeAmountCents || 0), 0);

	// total costs
	const totalCostUsd = costEvents.reduce((sum, e) => sum + parseFloat(e.costUsd || '0'), 0);

	// users with credits
	const usersWithCredits = credits.map(c => {
		const user = users.find(u => u.id === c.userId);
		return {
			...c,
			username: user?.username || 'Unknown',
			email: user?.email,
			pledgeTier: user?.pledgeTier
		};
	});

	// enrich calls with user info
	const enrichedCalls = calls.map(c => {
		const user = users.find(u => u.id === c.userId);
		return {
			...c,
			username: user?.username || 'Unknown',
			scheduledAt: c.scheduledAt?.toISOString(),
			completedAt: c.completedAt?.toISOString(),
			createdAt: c.createdAt?.toISOString(),
			updatedAt: c.updatedAt?.toISOString()
		};
	});

	// enrich audit log
	const enrichedAuditLog = auditLog.map(a => {
		const user = users.find(u => u.id === a.userId);
		return {
			...a,
			username: user?.username || 'Unknown',
			createdAt: a.createdAt?.toISOString()
		};
	});

	return {
		stats: {
			totalUsers,
			patronsByTier,
			totalCallSeconds,
			monthCallSeconds,
			callsByStatus,
			callsByOutcome,
			monthlyRevenueCents,
			totalCostUsd,
			pendingCalls: callsByStatus['scheduled'] || 0,
			frozenCalls: callsByStatus['frozen'] || 0
		},
		users: users.map(u => ({
			id: u.id,
			username: u.username,
			email: u.email,
			avatarUrl: u.avatarUrl,
			pledgeTier: u.pledgeTier,
			pledgeAmountCents: u.pledgeAmountCents,
			role: u.role,
			syncEnabled: u.syncEnabled,
			createdAt: u.createdAt?.toISOString()
		})),
		calls: enrichedCalls,
		credits: usersWithCredits,
		blocklist: blocklist.map(b => ({
			...b,
			createdAt: b.createdAt?.toISOString(),
			expiresAt: b.expiresAt?.toISOString()
		})),
		validationOverrides: validationOverrides.map(v => {
			const user = users.find(u => u.id === v.userId);
			return {
				...v,
				username: user?.username || 'Unknown',
				createdAt: v.createdAt?.toISOString(),
				expiresAt: v.expiresAt?.toISOString()
			};
		}),
		privacyIncidents: privacyIncidents.map(p => ({
			...p,
			createdAt: p.createdAt?.toISOString()
		})),
		costEvents: costEvents.map(e => ({
			...e,
			createdAt: e.createdAt?.toISOString()
		})),
		auditLog: enrichedAuditLog,
		webhookLogs: webhookLogs.map(w => ({
			...w,
			createdAt: w.createdAt?.toISOString(),
			processedAt: w.processedAt?.toISOString()
		}))
	};
};

export const actions: Actions = {
	// award credits to a user
	awardCredits: async ({ locals, platform, request }) => {
		if (!locals.user || !isAdmin(locals.user.role)) {
			error(403, 'Admin access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const seconds = parseInt(data.get('seconds') as string);
		const reason = data.get('reason') as string;
		const action = data.get('action') as string || 'award';

		if (!userId || isNaN(seconds) || seconds <= 0) {
			error(400, 'Invalid parameters');
		}

		const isDeduct = action === 'deduct';
		const delta = isDeduct ? -seconds : seconds;

		// get or create credits record
		const [existing] = await db
			.select()
			.from(table.userCallCredits)
			.where(eq(table.userCallCredits.userId, userId))
			.limit(1);

		const now = new Date();
		const balanceBefore = existing
			? (existing.creditsTotal || 0) - (existing.creditsUsed || 0) + (existing.creditsRefunded || 0)
			: 0;

		// prevent negative balance on deduct
		if (isDeduct && balanceBefore < seconds) {
			error(400, `Cannot deduct ${seconds}s, user only has ${balanceBefore}s available`);
		}

		if (existing) {
			await db
				.update(table.userCallCredits)
				.set({
					creditsTotal: (existing.creditsTotal || 0) + delta,
					version: (existing.version || 0) + 1
				})
				.where(eq(table.userCallCredits.userId, userId));
		} else {
			if (isDeduct) {
				error(400, 'Cannot deduct from user with no credits');
			}
			await db.insert(table.userCallCredits).values({
				userId,
				creditsTotal: seconds,
				creditsUsed: 0,
				creditsRefunded: 0,
				version: 1,
				lastRefillAt: now
			});
		}

		// audit log
		await db.insert(table.creditAuditLog).values({
			id: nanoid(),
			userId,
			eventType: isDeduct ? 'admin_deduct' : 'admin_award',
			seconds: delta,
			metadata: JSON.stringify({ reason, adminId: locals.user.id }),
			balanceBefore,
			balanceAfter: balanceBefore + delta,
			createdAt: now
		});

		// trigger freeze/unfreeze based on new balance
		const balanceAfter = balanceBefore + delta;
		if (!isDeduct && balanceAfter > 0) {
			// adding credits - try to unfreeze
			try {
				await unfreezeCallsIfPossible(db, userId, balanceAfter);
			} catch (e) {
				console.warn('[admin] unfreeze failed after credit award:', e);
			}
		} else if (isDeduct && balanceAfter <= 0) {
			// deducting to 0 or negative - freeze pending calls
			try {
				await freezePendingCalls(db, userId);
			} catch (e) {
				console.warn('[admin] freeze failed after credit deduction:', e);
			}
		}

		return { success: true };
	},

	// change user role
	changeRole: async ({ locals, platform, request }) => {
		if (!locals.user || !isAdmin(locals.user.role)) {
			error(403, 'Admin access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const role = data.get('role') as string;

		if (!userId || !['user', 'tester', 'moderator', 'admin'].includes(role)) {
			error(400, 'Invalid parameters');
		}

		// prevent self-demotion
		if (userId === locals.user.id && role !== 'admin') {
			error(400, 'Cannot demote yourself');
		}

		await db
			.update(table.user)
			.set({ role, updatedAt: new Date() })
			.where(eq(table.user.id, userId));

		return { success: true };
	},

	// add validation override
	addOverride: async ({ locals, platform, request }) => {
		if (!locals.user || !isModerator(locals.user.role)) {
			error(403, 'Moderator access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const reason = data.get('reason') as string;
		const expiresInDays = parseInt(data.get('expiresInDays') as string) || null;

		if (!userId) {
			error(400, 'User ID required');
		}

		const now = new Date();
		const expiresAt = expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : null;

		await db.insert(table.validationOverrides).values({
			userId,
			reason,
			approvedBy: locals.user.id,
			expiresAt,
			createdAt: now
		}).onConflictDoUpdate({
			target: table.validationOverrides.userId,
			set: { reason, approvedBy: locals.user.id, expiresAt, createdAt: now }
		});

		return { success: true };
	},

	// remove validation override
	removeOverride: async ({ locals, platform, request }) => {
		if (!locals.user || !isModerator(locals.user.role)) {
			error(403, 'Moderator access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const userId = data.get('userId') as string;

		await db.delete(table.validationOverrides).where(eq(table.validationOverrides.userId, userId));

		return { success: true };
	},

	// add to blocklist
	addBlocklist: async ({ locals, platform, request }) => {
		if (!locals.user || !isModerator(locals.user.role)) {
			error(403, 'Moderator access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const eId = (data.get('eId') as string)?.trim() || null;
		const phone = (data.get('phone') as string)?.trim() || null;
		const therapistName = data.get('therapistName') as string;
		const reason = data.get('reason') as string;
		const details = data.get('details') as string;
		const permanent = data.get('permanent') === 'true';

		if ((!eId && !phone) || !reason) {
			error(400, 'eId or phone required, plus reason');
		}

		await db.insert(table.therapistBlocklist).values({
			id: nanoid(),
			eId,
			phone,
			therapistName,
			reason,
			details,
			permanent,
			reportedByUser: locals.user.id,
			createdAt: new Date()
		});

		return { success: true };
	},

	// remove from blocklist
	removeBlocklist: async ({ locals, platform, request }) => {
		if (!locals.user || !isModerator(locals.user.role)) {
			error(403, 'Moderator access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const id = data.get('id') as string;

		await db.delete(table.therapistBlocklist).where(eq(table.therapistBlocklist.id, id));

		return { success: true };
	},

	// mark privacy incident as reviewed
	reviewIncident: async ({ locals, platform, request }) => {
		if (!locals.user || !isModerator(locals.user.role)) {
			error(403, 'Moderator access required');
		}

		const d1 = await getD1(platform);
		if (!d1) error(500, 'Database not available');
		const db = getDb(d1);

		const data = await request.formData();
		const id = data.get('id') as string;
		const actionTaken = data.get('actionTaken') as string;

		await db
			.update(table.privacyIncidents)
			.set({ adminReviewed: true, actionTaken })
			.where(eq(table.privacyIncidents.id, id));

		return { success: true };
	}
};
