import { createPersistedStore } from './createPersistedStore';
import { STORAGE_KEYS } from '$lib/constants';
import type { CampaignDraft } from '$lib/types';

const defaultDraft: CampaignDraft = {
	forSelf: true,
	radiusKm: 15,
	therapyTypes: [],
	languages: ['de'],
	specialties: [],
	urgency: 'medium'
};

export const campaignDraft = createPersistedStore<CampaignDraft>(
	STORAGE_KEYS.campaign,
	defaultDraft
);
