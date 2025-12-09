// therapist api service
import type { Therapist, CampaignDraft } from '$lib/types';

export interface TherapistSearchResult {
	therapists: Therapist[];
	totalResults: number;
	radius: number;
}

export async function searchTherapists(
	plz: string,
	draft: CampaignDraft
): Promise<TherapistSearchResult> {
	const params = new URLSearchParams({
		plz,
		billing: draft.insuranceType || 'GKV',
		...(draft.genderPref && { gender: draft.genderPref }),
		...(draft.ageGroup && { ageGroup: draft.ageGroup })
	});

	const res = await fetch(`/api/therapists?${params}`);
	if (!res.ok) throw new Error(`API error: ${res.status}`);

	const data = await res.json();
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
