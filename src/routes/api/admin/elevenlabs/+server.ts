// admin api for elevenlabs batch calls
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdmin } from '$lib/server/roles';
import { env } from '$env/dynamic/private';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !isAdmin(locals.user.role)) {
		error(403, 'Admin access required');
	}

	const apiKey = env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		error(500, 'ElevenLabs API key not configured');
	}

	try {
		// /workspace lists all batch calls for the workspace
		const response = await fetch(`${ELEVENLABS_API_BASE}/convai/batch-calling/workspace`, {
			headers: { 'xi-api-key': apiKey }
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('[admin/elevenlabs] list failed:', response.status, text);
			error(500, `ElevenLabs API error: ${response.status}`);
		}

		const data = await response.json();
		return json({ batchCalls: data.batch_calls || [] });
	} catch (e) {
		console.error('[admin/elevenlabs] list error:', e);
		error(500, 'Failed to fetch batch calls');
	}
};

// cancel a batch call
export const DELETE: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !isAdmin(locals.user.role)) {
		error(403, 'Admin access required');
	}

	const batchId = url.searchParams.get('batchId');
	if (!batchId) {
		error(400, 'Missing batchId');
	}

	const apiKey = env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		error(500, 'ElevenLabs not configured');
	}

	try {
		const response = await fetch(`${ELEVENLABS_API_BASE}/convai/batch-calling/${batchId}/cancel`, {
			method: 'POST',
			headers: { 'xi-api-key': apiKey }
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('[admin/elevenlabs] cancel failed:', response.status, text);
			error(500, `Failed to cancel: ${response.status}`);
		}

		return json({ success: true });
	} catch (e) {
		console.error('[admin/elevenlabs] cancel error:', e);
		error(500, 'Failed to cancel batch call');
	}
};
