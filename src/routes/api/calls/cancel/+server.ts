import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { callId } = body;

	if (!callId) {
		return json({ error: 'Missing callId' }, { status: 400 });
	}

	const db = getDb(platform);

	// find the call and verify ownership
	const [call] = await db
		.select()
		.from(table.scheduledCalls)
		.where(and(
			eq(table.scheduledCalls.id, callId),
			eq(table.scheduledCalls.userId, user.id)
		))
		.limit(1);

	if (!call) {
		return json({ error: 'Call not found' }, { status: 404 });
	}

	if (call.status !== 'scheduled') {
		return json({ error: 'Can only cancel scheduled calls' }, { status: 400 });
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
