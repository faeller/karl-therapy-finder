// account page - requires auth
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { updateSyncEnabled } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { getCredits } from '$lib/server/creditService';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		redirect(302, '/auth/patreon');
	}

	// fetch call credits (auto-refreshes if new month)
	let credits = { total: 0, used: 0, remaining: 0, tierMinutes: 0 };

	const d1 = await getD1(platform);
	if (d1) {
		const db = getDb(d1);
		const userCredits = await getCredits(
			db,
			locals.user.id,
			locals.user.pledgeAmountCents,
			locals.user.pledgeTier
		);
		credits = {
			total: userCredits.total,
			used: userCredits.used,
			remaining: userCredits.remaining,
			tierMinutes: userCredits.tierMinutes
		};
	}

	return { user: locals.user, credits };
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
