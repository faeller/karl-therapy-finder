// POST /api/calls/schedule - schedule an automated call to a therapist practice
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { checkCanScheduleCall, scheduleCall } from '$lib/server/callService';

interface ScheduleCallBody {
	therapistId: string;
	therapistName: string;
	eId: string;
	patientName: string;
	patientInsurance: string;
	therapyType?: string;
	callbackPhone: string;
	urgency?: 'low' | 'medium' | 'high';
}

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) {
		error(401, 'Not authenticated');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);

	let body: ScheduleCallBody;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	// validate required fields
	if (!body.therapistId || !body.eId || !body.patientName || !body.callbackPhone) {
		error(400, 'Missing required fields: therapistId, eId, patientName, callbackPhone');
	}

	// preflight checks
	const preflight = await checkCanScheduleCall(
		db,
		locals.user.id,
		body.eId,
		locals.user.pledgeTier
	);

	if (!preflight.canProceed) {
		switch (preflight.reason) {
			case 'tier_required':
				error(402, 'Premium tier required for automated calls');
			case 'no_credits':
				error(402, 'No call credits remaining');
			case 'therapist_blocked':
				error(403, 'This practice does not accept automated calls');
			case 'call_already_scheduled':
				error(409, 'Call already scheduled for this therapist');
			default:
				error(400, 'Cannot schedule call');
		}
	}

	try {
		const result = await scheduleCall(db, {
			userId: locals.user.id,
			therapistId: body.therapistId,
			therapistName: body.therapistName,
			eId: body.eId,
			patientName: body.patientName,
			patientInsurance: body.patientInsurance || 'GKV',
			therapyType: body.therapyType || 'Psychotherapie',
			callbackPhone: body.callbackPhone,
			urgency: body.urgency
		});

		return json({
			success: true,
			callId: result.callId,
			scheduledAt: result.scheduledAt.toISOString(),
			batchId: result.batchId,
			creditsRemaining: (preflight.creditsRemaining ?? 1) - 1
		});
	} catch (e) {
		console.error('[schedule] failed:', e);
		error(500, e instanceof Error ? e.message : 'Failed to schedule call');
	}
};
