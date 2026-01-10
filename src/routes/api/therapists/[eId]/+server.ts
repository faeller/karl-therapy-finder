// GET /api/therapists/:eId - get detailed therapist info including opening hours
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getD1 } from '$lib/server/d1';
import { getTherapistDetails } from '$lib/server/callService';

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	// allow unauthenticated access for basic info
	// but require auth for opening hours (costs money to parse)
	const d1 = await getD1(platform);
	if (!d1) {
		error(500, 'Database not available');
	}

	const db = getDb(d1);
	const eId = params.eId;

	if (!eId || !/^\d+$/.test(eId)) {
		error(400, 'Invalid therapist e_id');
	}

	// if authenticated, include opening hours
	// (uses ai to parse, costs money)
	if (locals.user) {
		try {
			const { details, costUsd } = await getTherapistDetails(db, eId, locals.user.id);

			return json({
				eId: details.eId,
				name: details.name,
				phone: details.phone,
				address: details.address,
				openingHours: details.openingHours,
				fromCache: details.fromCache,
				costUsd
			});
		} catch (e) {
			console.error('[therapist] details failed:', e);
			error(500, 'Failed to fetch therapist details');
		}
	}

	// unauthenticated - just return basic cached info if available
	const { eq } = await import('drizzle-orm');
	const { therapistCache } = await import('$lib/server/db/schema');

	const [cached] = await db
		.select()
		.from(therapistCache)
		.where(eq(therapistCache.eId, eId))
		.limit(1);

	if (cached) {
		return json({
			eId: cached.eId,
			name: cached.name,
			phone: cached.phone,
			address: cached.address,
			openingHours: cached.openingHours ? JSON.parse(cached.openingHours) : null,
			fromCache: true
		});
	}

	// not cached and not authenticated
	error(401, 'Authentication required to fetch new therapist details');
};
