// GET /api/calls/:callId - get call status
// DELETE /api/calls/:callId - cancel scheduled call
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { getCallStatus, cancelCall } from '$lib/server/callService';

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	if (!locals.user) {
		error(401, 'Not authenticated');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);
	const call = await getCallStatus(db, params.callId, locals.user.id);

	if (!call) {
		error(404, 'Call not found');
	}

	return json({
		id: call.id,
		therapistName: call.therapistName,
		therapistPhone: call.therapistPhone,
		scheduledAt: call.scheduledAt?.toISOString(),
		attemptNumber: call.attemptNumber,
		maxAttempts: call.maxAttempts,
		status: call.status,
		outcome: call.outcome,
		appointmentDate: call.appointmentDate,
		appointmentTime: call.appointmentTime,
		callbackInfo: call.callbackInfo,
		rejectionReason: call.rejectionReason,
		notes: call.notes,
		durationSeconds: call.durationSeconds,
		completedAt: call.completedAt?.toISOString()
	});
};

export const DELETE: RequestHandler = async ({ locals, platform, params }) => {
	if (!locals.user) {
		error(401, 'Not authenticated');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);
	const success = await cancelCall(db, params.callId, locals.user.id);

	if (!success) {
		error(404, 'Call not found or cannot be cancelled');
	}

	return json({ success: true });
};
