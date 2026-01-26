// gdpr self-service - data export and deletion
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { invalidateSession, sessionCookieName } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		redirect(302, '/auth/patreon');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		return { user: locals.user, stats: null };
	}

	const db = getDb(d1);

	// fetch counts for user data
	const [
		scheduledCallsCount,
		userCampaignCount,
		userContactsCount,
		creditAuditCount,
		callCostCount
	] = await Promise.all([
		db.select().from(table.scheduledCalls).where(eq(table.scheduledCalls.userId, locals.user.id)),
		db.select().from(table.userCampaign).where(eq(table.userCampaign.userId, locals.user.id)),
		db.select().from(table.userContacts).where(eq(table.userContacts.userId, locals.user.id)),
		db.select().from(table.creditAuditLog).where(eq(table.creditAuditLog.userId, locals.user.id)),
		db.select().from(table.callCostEvents).where(eq(table.callCostEvents.userId, locals.user.id))
	]);

	return {
		user: locals.user,
		stats: {
			scheduledCalls: scheduledCallsCount.length,
			userCampaign: userCampaignCount.length,
			userContacts: userContactsCount.length,
			creditAudit: creditAuditCount.length,
			callCosts: callCostCount.length
		}
	};
};

export const actions: Actions = {
	exportData: async ({ locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'not authenticated' });
		}

		const d1 = await getD1(platform);
		if (!d1) {
			return fail(500, { error: 'database not available' });
		}

		const db = getDb(d1);

		// fetch all user data
		const [
			userData,
			sessionsData,
			scheduledCallsData,
			userCampaignData,
			userContactsData,
			creditsData,
			creditAuditData,
			callCostData,
			validationOverrideData
		] = await Promise.all([
			db.select().from(table.user).where(eq(table.user.id, locals.user.id)),
			db.select().from(table.session).where(eq(table.session.userId, locals.user.id)),
			db.select().from(table.scheduledCalls).where(eq(table.scheduledCalls.userId, locals.user.id)),
			db.select().from(table.userCampaign).where(eq(table.userCampaign.userId, locals.user.id)),
			db.select().from(table.userContacts).where(eq(table.userContacts.userId, locals.user.id)),
			db.select().from(table.userCallCredits).where(eq(table.userCallCredits.userId, locals.user.id)),
			db.select().from(table.creditAuditLog).where(eq(table.creditAuditLog.userId, locals.user.id)),
			db.select().from(table.callCostEvents).where(eq(table.callCostEvents.userId, locals.user.id)),
			db.select().from(table.validationOverrides).where(eq(table.validationOverrides.userId, locals.user.id))
		]);

		const exportData = {
			exportDate: new Date().toISOString(),
			user: userData[0],
			sessions: sessionsData,
			scheduledCalls: scheduledCallsData,
			userCampaign: userCampaignData,
			userContacts: userContactsData,
			credits: creditsData[0],
			creditAuditLog: creditAuditData,
			callCostEvents: callCostData,
			validationOverride: validationOverrideData[0] || null
		};

		return {
			success: true,
			data: JSON.stringify(exportData, null, 2)
		};
	},

	deleteAccount: async ({ locals, platform, cookies }) => {
		if (!locals.user) {
			return fail(401, { error: 'not authenticated' });
		}

		const d1 = await getD1(platform);
		if (!d1) {
			return fail(500, { error: 'database not available' });
		}

		const db = getDb(d1);

		try {
			// delete all user data in order (respecting foreign keys)
			// first: delete tables that reference scheduled_calls.id
			await db.delete(table.creditAuditLog).where(eq(table.creditAuditLog.userId, locals.user.id));
			await db.delete(table.callCostEvents).where(eq(table.callCostEvents.userId, locals.user.id));

			// delete privacy incidents and webhook logs for user's calls
			const userCallIds = await db.select({ id: table.scheduledCalls.id }).from(table.scheduledCalls).where(eq(table.scheduledCalls.userId, locals.user.id));
			const callIds = userCallIds.map(c => c.id);
			if (callIds.length > 0) {
				await db.delete(table.privacyIncidents).where(eq(table.privacyIncidents.callId, callIds[0])); // d1 doesn't support inArray, delete one by one if needed
				for (const callId of callIds) {
					await db.delete(table.privacyIncidents).where(eq(table.privacyIncidents.callId, callId));
					await db.delete(table.webhookLogs).where(eq(table.webhookLogs.callId, callId));
				}
			}

			// now safe to delete scheduled_calls
			await db.delete(table.scheduledCalls).where(eq(table.scheduledCalls.userId, locals.user.id));
			await db.delete(table.userCallCredits).where(eq(table.userCallCredits.userId, locals.user.id));
			await db.delete(table.userCampaign).where(eq(table.userCampaign.userId, locals.user.id));
			await db.delete(table.userContacts).where(eq(table.userContacts.userId, locals.user.id));
			await db.delete(table.validationOverrides).where(eq(table.validationOverrides.userId, locals.user.id));

			// delete sessions (invalidates auth)
			const sessions = await db.select().from(table.session).where(eq(table.session.userId, locals.user.id));
			for (const session of sessions) {
				await invalidateSession(db, session.id);
			}

			// finally delete user record
			await db.delete(table.user).where(eq(table.user.id, locals.user.id));

			console.log('[gdpr] deleted all data for user:', locals.user.id);
		} catch (e) {
			console.error('[gdpr] failed to delete account:', e);
			return fail(500, { error: 'deletion failed' });
		}

		// clear session cookie and redirect (outside try/catch since redirect throws)
		cookies.delete(sessionCookieName, { path: '/' });
		redirect(302, '/chat?deleted=1');
	}
};
