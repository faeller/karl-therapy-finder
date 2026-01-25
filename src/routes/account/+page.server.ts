// account page - requires auth
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { updateSyncEnabled } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { eq, or, and, desc, inArray } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { getCredits } from '$lib/server/creditService';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		redirect(302, '/auth/patreon');
	}

	// fetch call credits in seconds (auto-refreshes if new month)
	let credits = { totalSeconds: 0, usedSeconds: 0, availableSeconds: 0, tierSeconds: 0, projectedSeconds: 0, pendingCalls: 0 };
	let pendingCalls: Array<{
		id: string;
		therapistName: string | null;
		status: string;
		scheduledAt: string | null;
		projectedSeconds: number;
	}> = [];
	let callHistory: Array<{
		id: string;
		therapistName: string | null;
		status: string;
		outcome: string | null;
		durationSeconds: number | null;
		completedAt: string | null;
		appointmentDate: string | null;
		appointmentTime: string | null;
	}> = [];

	const d1 = await getD1(platform);
	if (d1) {
		const db = getDb(d1);
		const userCredits = await getCredits(
			db,
			locals.user.id,
			locals.user.pledgeAmountCents,
			locals.user.pledgeTier
		);

		// get pending/frozen calls (reserving credits)
		const pending = await db
			.select()
			.from(table.scheduledCalls)
			.where(
				and(
					eq(table.scheduledCalls.userId, locals.user.id),
					inArray(table.scheduledCalls.status, ['scheduled', 'in_progress', 'frozen'])
				)
			)
			.orderBy(desc(table.scheduledCalls.scheduledAt));

		pendingCalls = pending.map(c => ({
			id: c.id,
			therapistName: c.therapistName,
			status: c.status,
			scheduledAt: c.scheduledAt?.toISOString() || null,
			projectedSeconds: c.projectedSeconds || 180
		}));

		const projectedSeconds = pending.reduce((sum, c) => sum + (c.projectedSeconds || 180), 0);

		// get completed call history (last 20)
		const history = await db
			.select()
			.from(table.scheduledCalls)
			.where(
				and(
					eq(table.scheduledCalls.userId, locals.user.id),
					inArray(table.scheduledCalls.status, ['completed', 'failed', 'cancelled'])
				)
			)
			.orderBy(desc(table.scheduledCalls.completedAt))
			.limit(20);

		// only include calls that actually used seconds
		callHistory = history
			.filter(c => c.durationSeconds && c.durationSeconds > 0)
			.map(c => ({
				id: c.id,
				therapistName: c.therapistName,
				status: c.status,
				outcome: c.outcome,
				durationSeconds: c.durationSeconds,
				completedAt: c.completedAt?.toISOString() || null,
				appointmentDate: c.appointmentDate,
				appointmentTime: c.appointmentTime
			}));

		credits = {
			totalSeconds: userCredits.total,
			usedSeconds: userCredits.used,
			availableSeconds: userCredits.available,
			tierSeconds: userCredits.tierSeconds,
			projectedSeconds,
			pendingCalls: pending.length
		};
	}

	return { user: locals.user, credits, pendingCalls, callHistory };
};

export const actions: Actions = {
	toggleSync: async ({ locals, request, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const d1 = await getD1(platform);
		if (!d1) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const enabled = formData.get('enabled') === 'true';

		try {
			const db = getDb(d1);
			await updateSyncEnabled(db, locals.user.id, enabled);

			// if disabling sync, delete server data
			if (!enabled) {
				await db.delete(table.userCampaign).where(eq(table.userCampaign.userId, locals.user.id));
				await db.delete(table.userContacts).where(eq(table.userContacts.userId, locals.user.id));
				console.log('[sync] deleted server data for user:', locals.user.id);
			}

			return { success: true, syncEnabled: enabled };
		} catch (e) {
			console.error('Failed to update sync setting:', e);
			return fail(500, { error: 'Failed to update setting' });
		}
	}
};
