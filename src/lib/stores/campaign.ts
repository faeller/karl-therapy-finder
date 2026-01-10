// campaign store - wrapper around dataSession
import { derived, type Readable } from 'svelte/store';
import { dataSession } from './dataSession';
import type { CampaignDraft } from '$lib/types';

const defaultDraft: CampaignDraft = {
	forSelf: true,
	radiusKm: 15,
	therapyTypes: [],
	languages: ['de'],
	specialties: [],
	urgency: 'medium'
};

interface CampaignStore extends Readable<CampaignDraft> {
	set: (value: CampaignDraft) => void;
	update: (updater: (c: CampaignDraft) => CampaignDraft) => void;
	reset: () => void;
	hydrate: () => CampaignDraft;
}

function createCampaignStore(): CampaignStore {
	const derived$ = derived(dataSession, ($data) => $data.campaign);

	return {
		subscribe: derived$.subscribe,
		set: (value: CampaignDraft) => dataSession.updateCampaign(() => value),
		update: (updater: (c: CampaignDraft) => CampaignDraft) => dataSession.updateCampaign(updater),
		reset: () => dataSession.updateCampaign(() => ({ ...defaultDraft })),
		hydrate: () => dataSession.getData().campaign
	};
}

export const campaignDraft = createCampaignStore();
