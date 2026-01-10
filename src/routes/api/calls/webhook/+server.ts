// POST /api/calls/webhook - receive elevenlabs call outcome webhooks
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { verifyWebhookSignature, type ElevenLabsWebhookPayload } from '$lib/server/elevenlabs';
import { handleCallWebhook } from '$lib/server/callService';

export const POST: RequestHandler = async ({ platform, request }) => {
	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);

	// get raw body for signature verification
	const rawBody = await request.text();

	// verify signature
	const signature = request.headers.get('x-elevenlabs-signature');
	const timestamp = request.headers.get('x-elevenlabs-timestamp');

	const isValid = await verifyWebhookSignature(rawBody, signature, timestamp);
	if (!isValid) {
		console.error('[webhook] invalid signature');
		error(401, 'Invalid signature');
	}

	// parse payload
	let payload: ElevenLabsWebhookPayload;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		error(400, 'Invalid JSON payload');
	}

	if (!payload.conversation_id) {
		error(400, 'Missing conversation_id');
	}

	console.log('[webhook] received:', payload.conversation_id, payload.status);

	try {
		await handleCallWebhook(db, payload);
		return json({ success: true });
	} catch (e) {
		console.error('[webhook] handling failed:', e);
		// still return 200 to avoid retries for app errors
		return json({ success: false, error: String(e) });
	}
};
