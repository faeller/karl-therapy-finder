import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { cancelCall } from '$lib/server/callService';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user) {
		error(401, 'Not authenticated');
	}

	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);

	let body: { callId: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	const { callId } = body;

	if (!callId) {
		error(400, 'Missing callId');
	}

	const success = await cancelCall(db, callId, locals.user.id);

	if (!success) {
		error(404, 'Call not found or not cancellable');
	}

	return json({ success: true });
};
