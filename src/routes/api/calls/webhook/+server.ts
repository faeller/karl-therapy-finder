// POST /api/calls/webhook - receive elevenlabs call outcome webhooks
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { verifyWebhookSignature, type ElevenLabsWebhookPayload } from '$lib/server/elevenlabs';
import { handleCallWebhook } from '$lib/server/callService';
import * as table from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ platform, request }) => {
	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);
	const now = new Date();

	// get raw body for signature verification
	const rawBody = await request.text();

	// capture all headers for debugging
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});

	// verify signature (header: elevenlabs-signature, format: t=<ts>,v0=<hash>)
	const signatureHeader = request.headers.get('elevenlabs-signature');

	const isValid = await verifyWebhookSignature(rawBody, signatureHeader);
	if (!isValid) {
		console.error('[webhook] invalid signature');
		// still log invalid webhooks for debugging
		await db.insert(table.webhookLogs).values({
			id: nanoid(),
			source: 'elevenlabs',
			rawPayload: rawBody,
			headers: JSON.stringify(headers),
			processingError: 'invalid signature',
			createdAt: now
		});
		error(401, 'Invalid signature');
	}

	// parse payload
	let payload: ElevenLabsWebhookPayload;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		await db.insert(table.webhookLogs).values({
			id: nanoid(),
			source: 'elevenlabs',
			rawPayload: rawBody,
			headers: JSON.stringify(headers),
			processingError: 'invalid json',
			createdAt: now
		});
		error(400, 'Invalid JSON payload');
	}

	// extract data from nested structure
	const conversationId = payload.data?.conversation_id;
	const status = payload.data?.status;

	// log the webhook
	const logId = nanoid();
	await db.insert(table.webhookLogs).values({
		id: logId,
		source: 'elevenlabs',
		conversationId,
		status,
		rawPayload: rawBody,
		headers: JSON.stringify(headers),
		createdAt: now
	});

	if (!conversationId) {
		await db.update(table.webhookLogs)
			.set({ processingError: 'missing conversation_id' })
			.where(eq(table.webhookLogs.id, logId));
		error(400, 'Missing conversation_id');
	}

	console.log('[webhook] received:', conversationId, status);

	try {
		const callId = await handleCallWebhook(db, payload);
		await db.update(table.webhookLogs)
			.set({ callId, processedAt: new Date() })
			.where(eq(table.webhookLogs.id, logId));
		return json({ success: true });
	} catch (e) {
		console.error('[webhook] handling failed:', e);
		await db.update(table.webhookLogs)
			.set({ processingError: String(e), processedAt: new Date() })
			.where(eq(table.webhookLogs.id, logId));
		// still return 200 to avoid retries for app errors
		return json({ success: false, error: String(e) });
	}
};
