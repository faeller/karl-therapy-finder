// reverse geocode via photon (osm-based, eu-hosted, privacy-friendly)
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PhotonFeature {
	properties?: {
		postcode?: string;
	};
}

interface PhotonResponse {
	features?: PhotonFeature[];
}

export const GET: RequestHandler = async ({ url }) => {
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lon = parseFloat(url.searchParams.get('lon') || '');

	if (isNaN(lat) || isNaN(lon)) {
		return json({ error: 'invalid coords' }, { status: 400 });
	}

	try {
		const res = await fetch(
			`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=de`
		);

		if (!res.ok) {
			return json({ error: 'geo lookup failed' }, { status: 502 });
		}

		const data: PhotonResponse = await res.json();
		const plz = data.features?.[0]?.properties?.postcode || null;
		return json({ plz });
	} catch {
		return json({ error: 'geo lookup failed' }, { status: 502 });
	}
};
