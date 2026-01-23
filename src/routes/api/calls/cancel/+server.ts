import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

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

	// find the call and verify ownership
	const [call] = await db
		.select()
		.from(table.scheduledCalls)
		.where(and(
			eq(table.scheduledCalls.id, callId),
			eq(table.scheduledCalls.userId, locals.user.id)
		))
		.limit(1);

	if (!call) {
		error(404, 'Call not found');
	}

	if (call.status !== 'scheduled') {
		error(400, 'Can only cancel scheduled calls');
	}

	// update status to cancelled
	await db
		.update(table.scheduledCalls)
		.set({
			status: 'cancelled',
			updatedAt: new Date()
		})
		.where(eq(table.scheduledCalls.id, callId));

	// todo: cancel the elevenlabs batch call if possible

	return json({ success: true });
};
