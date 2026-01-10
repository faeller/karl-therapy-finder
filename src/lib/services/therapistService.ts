// therapist api service
import type { Therapist, CampaignDraft } from '$lib/types';

export type SearchErrorType = 'network' | 'server' | 'timeout' | 'invalid_plz';

export class SearchError extends Error {
	constructor(
		public type: SearchErrorType,
		message: string
	) {
		super(message);
		this.name = 'SearchError';
	}
}

export interface TherapistSearchResult {
	therapists: Therapist[];
	totalResults: number;
	radius: number;
}

export async function searchTherapists(
	plz: string,
	draft: CampaignDraft
): Promise<TherapistSearchResult> {
	if (!plz || !/^\d{5}$/.test(plz)) {
		throw new SearchError('invalid_plz', 'Invalid PLZ format');
	}

	const params = new URLSearchParams({
		plz,
		billing: draft.insuranceType || 'GKV',
		...(draft.genderPref && { gender: draft.genderPref }),
		...(draft.ageGroup && { ageGroup: draft.ageGroup })
	});

	let res: Response;
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 15000);

		res = await fetch(`/api/therapists?${params}`, {
			signal: controller.signal
		});

		clearTimeout(timeoutId);
	} catch (e) {
		if (e instanceof Error && e.name === 'AbortError') {
			throw new SearchError('timeout', 'Request timed out');
		}
		throw new SearchError('network', 'Network error - check your connection');
	}

	if (!res.ok) {
		if (res.status >= 500) {
			throw new SearchError('server', 'Server error - try again later');
		}
		throw new SearchError('server', `API error: ${res.status}`);
	}

	const data: TherapistSearchResult = await res.json();
	return {
		therapists: data.therapists || [],
		totalResults: data.totalResults || 0,
		radius: data.radius || 0
	};
}

// merge new therapists with existing, dedupe by id
export function mergeTherapists(
	existing: Therapist[],
	incoming: Therapist[]
): Therapist[] {
	const existingIds = new Set(existing.map((t) => t.id));
	const newTherapists = incoming.filter((t) => !existingIds.has(t.id));
	return [...existing, ...newTherapists];
}
