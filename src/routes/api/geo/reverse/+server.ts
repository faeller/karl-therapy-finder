// reverse geocode proxy - snaps coords to 2km grid for privacy
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// snap to ~500m grid (all users in same cell get same coords sent externally)
function snap(coord: number): number {
	return Math.round(coord * 200) / 200;
}

export const GET: RequestHandler = async ({ url }) => {
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lon = parseFloat(url.searchParams.get('lon') || '');

	if (isNaN(lat) || isNaN(lon)) {
		return json({ error: 'invalid coords' }, { status: 400 });
	}

	const snappedLat = snap(lat);
	const snappedLon = snap(lon);

	try {
		const res = await fetch(
			`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${snappedLat}&longitude=${snappedLon}&localityLanguage=de`
		);

		if (!res.ok) {
			return json({ error: 'geo lookup failed' }, { status: 502 });
		}

		const data: { postcode?: string } = await res.json();
		return json({ plz: data.postcode || null });
	} catch {
		return json({ error: 'geo lookup failed' }, { status: 502 });
	}
};
