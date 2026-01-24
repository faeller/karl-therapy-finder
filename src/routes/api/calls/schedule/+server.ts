// POST /api/calls/schedule - schedule an automated call to a therapist practice
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { checkCanScheduleCall, scheduleCall, scheduleDebugCall } from '$lib/server/callService';
import { validateCallRequest } from '$lib/server/aiService';
import { DEBUG_THERAPIST_ID } from '$lib/stores/debug';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';

interface ScheduleCallBody {
	therapistId: string;
	therapistName: string;
	eId: string;
	patientName: string;
	patientInsurance: string;
	therapyType?: string;
	callbackPhone: string;
	patientEmail?: string;
	urgency?: 'low' | 'medium' | 'high';
	isDebug?: boolean;
	debugTestPhone?: string; // override therapist phone in debug mode
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

	// handle debug mode - skip tier checks, override phone with debug test phone
	// SECURITY: debug mode requires isAdmin
	const isDebugTherapist = body.therapistId === DEBUG_THERAPIST_ID;
	const isDebugMode = body.isDebug && body.debugTestPhone && locals.user.isAdmin === true;

	// reject debug attempts from non-admins
	if ((body.isDebug || isDebugTherapist) && !locals.user.isAdmin) {
		error(403, 'Debug mode requires admin access');
	}

	// validate required fields
	if (isDebugMode) {
		if (!body.callbackPhone) {
			error(400, 'Missing callback phone');
		}
		if (!body.debugTestPhone) {
			error(400, 'Missing debug test phone - set it in /debug');
		}
	} else if (!body.therapistId || !body.eId || !body.patientName || !body.callbackPhone) {
		error(400, 'Missing required fields: therapistId, eId, patientName, callbackPhone');
	}

	// anti-abuse validation (runs for all modes including debug)
	const override = await db
		.select()
		.from(table.validationOverrides)
		.where(eq(table.validationOverrides.userId, locals.user.id))
		.limit(1);

	if (override.length === 0) {
		const validation = await validateCallRequest(body.patientName, body.callbackPhone, body.patientEmail);
		if (!validation.result.valid) {
			console.warn('[schedule] validation failed:', validation.result.reason, body.patientName);
			error(
				400,
				'Es tut uns super leid, unser Projekt ist noch sehr jung und wir versuchen Praxen vor Missbrauch zu schützen. ' +
					`Erklärung:\n\n${validation.result.reason}.\n\n` +
					'Falls dies ein Fehler ist, kontaktiere uns.\nWir helfen dir gerne weiter!\n\nProbiere sonst gerne andere Daten.\nWir meinen es nicht böse.'
			);
		}
	}

	// debug mode: use scheduleDebugCall with phone override (calls debug test phone instead of therapist)
	if (isDebugMode || isDebugTherapist) {
		try {
			const result = await scheduleDebugCall(db, {
				userId: locals.user.id,
				therapistId: isDebugTherapist ? undefined : body.therapistId, // preserve real id if not debug therapist
				eId: isDebugTherapist ? undefined : body.eId, // preserve real eId if not debug therapist
				therapistName: body.therapistName,
				therapistPhone: body.debugTestPhone || body.callbackPhone, // call the debug test phone
				patientName: body.patientName,
				patientInsurance: body.patientInsurance || 'GKV',
				therapyType: body.therapyType || 'Psychotherapie',
				callbackPhone: body.callbackPhone,
				patientEmail: body.patientEmail,
				urgency: body.urgency
			});

			return json({
				success: true,
				callId: result.callId,
				scheduledAt: result.scheduledAt.toISOString(),
				batchId: result.batchId,
				creditsRemaining: 999
			});
		} catch (e) {
			console.error('[schedule-debug] failed:', e);
			error(500, e instanceof Error ? e.message : 'Failed to schedule debug call');
		}
	}

	// preflight checks for real calls
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
			patientEmail: body.patientEmail,
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
