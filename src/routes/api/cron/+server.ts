// cron endpoint - triggered by cloudflare cron or external services
// handles scheduled tasks like reminders, cleanup, etc.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { env } from '$env/dynamic/private';

interface CronResult {
	task: string;
	status: 'ok' | 'error' | 'skipped';
	message?: string;
	count?: number;
}

// verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
	const authHeader = request.headers.get('Authorization');
	const cronSecret = env.CRON_SECRET;

	if (!cronSecret) {
		console.warn('[cron] CRON_SECRET not configured');
		return false;
	}

	return authHeader === `Bearer ${cronSecret}`;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!verifyCronSecret(request)) {
		error(401, 'Unauthorized');
	}

	const d1 = await getD1(platform);
	if (!d1) error(500, 'Database not available');

	const db = getDb(d1);
	const results: CronResult[] = [];

	// task 1: clean up expired sessions (older than 30 days)
	try {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		// note: actual cleanup depends on schema - this is a placeholder
		// await db.delete(table.session).where(lt(table.session.expiresAt, thirtyDaysAgo));
		results.push({ task: 'cleanup_sessions', status: 'skipped', message: 'not implemented yet' });
	} catch (e) {
		results.push({ task: 'cleanup_sessions', status: 'error', message: String(e) });
	}

	// task 2: send reminder notifications (placeholder)
	// this will be expanded when notification system is ready
	try {
		// find users who:
		// - have sync enabled
		// - haven't contacted therapists in X days
		// - haven't completed their search
		// then queue notifications
		results.push({ task: 'send_reminders', status: 'skipped', message: 'notification system not ready' });
	} catch (e) {
		results.push({ task: 'send_reminders', status: 'error', message: String(e) });
	}

	// task 3: generate daily stats (placeholder)
	try {
		// count active users, contacts made, etc.
		results.push({ task: 'daily_stats', status: 'skipped', message: 'not implemented yet' });
	} catch (e) {
		results.push({ task: 'daily_stats', status: 'error', message: String(e) });
	}

	const hasErrors = results.some((r) => r.status === 'error');

	return json({
		success: !hasErrors,
		timestamp: new Date().toISOString(),
		results
	});
};

// also allow GET for simple health check / manual trigger
export const GET: RequestHandler = async ({ request, platform }) => {
	if (!verifyCronSecret(request)) {
		error(401, 'Unauthorized');
	}

	return json({
		status: 'ok',
		message: 'Cron endpoint ready. Use POST to trigger tasks.',
		timestamp: new Date().toISOString()
	});
};
