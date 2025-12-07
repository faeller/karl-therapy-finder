import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CampaignDraft } from '$lib/types';

const defaultDraft: CampaignDraft = {
	forSelf: true,
	radiusKm: 15,
	therapyTypes: [],
	languages: ['de'],
	specialties: [],
	urgency: 'medium'
};

function getStored(): CampaignDraft {
	if (!browser) return defaultDraft;
	try {
		const stored = localStorage.getItem('karl-campaign');
		return stored ? JSON.parse(stored) : defaultDraft;
	} catch {
		return defaultDraft;
	}
}

const { subscribe, set, update } = writable<CampaignDraft>(defaultDraft);

// hydrate from localStorage on client
if (browser) {
	set(getStored());
}

export const campaignDraft = {
	subscribe,
	set: (value: CampaignDraft) => {
		if (browser) {
			localStorage.setItem('karl-campaign', JSON.stringify(value));
		}
		set(value);
	},
	update: (fn: (draft: CampaignDraft) => CampaignDraft) => {
		update((current) => {
			const updated = fn(current);
			if (browser) {
				localStorage.setItem('karl-campaign', JSON.stringify(updated));
			}
			return updated;
		});
	},
	reset: () => {
		if (browser) {
			localStorage.removeItem('karl-campaign');
		}
		set(defaultDraft);
	}
};
