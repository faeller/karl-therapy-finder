// GET /api/calls - list user's scheduled calls
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { getUserCalls, getUserCredits } from '$lib/server/callService';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.user) {
		error(401, 'Not authenticated');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);
	const limit = parseInt(url.searchParams.get('limit') || '20', 10);

	const [calls, credits] = await Promise.all([
		getUserCalls(db, locals.user.id, Math.min(limit, 50)),
		getUserCredits(db, locals.user.id)
	]);

	return json({
		calls: calls.map((call) => ({
			id: call.id,
			therapistName: call.therapistName,
			therapistPhone: call.therapistPhone,
			scheduledAt: call.scheduledAt?.toISOString(),
			attemptNumber: call.attemptNumber,
			status: call.status,
			outcome: call.outcome,
			appointmentDate: call.appointmentDate,
			appointmentTime: call.appointmentTime,
			completedAt: call.completedAt?.toISOString()
		})),
		credits
	});
};
